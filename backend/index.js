import "./config/env.js";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

import { initSocket } from "./config/socket.js";
import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

import uploadRoutes from "./routes/upload.routes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminRegistrationsRoutes from "./routes/adminRegistration.routes.js";
import adminDashboardRoutes from "./routes/Admin/adminDashboard.routes.js";
import adminFranchiseRoutes from "./routes/adminFranchise.routes.js";
import adminProductsRoutes from "./routes/vendor/Admin/adminProducts.routes.js";
import adminVendorAnalyticsRoutes from "./routes/vendor/Admin/adminAnalytics.routes.js";
import adminVendorDashboardRoutes from "./routes/vendor/Admin/adminDashboard.routes.js";
import adminVendorRoutes from "./routes/vendor/Admin/adminVendor.routes.js";
import adminOrdersRoutes from "./routes/vendor/Admin/adminOrders.routes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import productDetailsRoutes from "./routes/productDetailsRoutes.js";
import adminDoctorRoutes from "./routes/Admin/adminDoctor.routes.js";
import adminConsultationRoutes from "./routes/Admin/adminConsultation.routes.js";
import orderAdminRoutes from "./routes/orderAdmin.routes.js";
import adminPathologyRoutes from "./routes/adminPathologyRoutes.js";
import adminManufacturerRoutes from "./routes/adminManufacturerRoutes.js";
import adminBulkManufacturingRoutes from "./routes/adminBulkManufacturingRoutes.js";

import deliveryRoutes from "./routes/delivery.js";
import deliveryAgentRoutes from "./routes/deliveryAgentRoutes.js";
import deliveryAdminRoutes from "./routes/deliveryAdminRoutes.js";
import marketingAgentRoutes from "./routes/marketingAgentRoutes.js";
import dailyPlanRoutes from "./routes/dailyPlanRoutes.js";
import saleBillRoutes from "./routes/saleBillRoutes.js";

import cardroutes from "./routes/cardroutes.js";
import AllCategoryRoutes from "./routes/AllcategoryRoutes.js";
import LaunchRoutes from "./routes/LaunchRoutes.js";
import TrendRoute from "./routes/TrendRoute.js";
import BrandRoutes from "./routes/BrandRoutes.js";
import DealRoutes from "./routes/DealRoutes.js";
import BannerRoutes from "./routes/BannerRoutes.js";
import healthArticleRoutes from "./routes/healthArticleRoutes.js";
import UserRoute from "./routes/UserRoute.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import questionsRoutes from "./routes/questionRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import testimonialRoutes from "./routes/testimonial.routes.js";
import labTestRoutes from "./routes/labTestRoutes.js";
import doctorRoutes from "./routes/Doctors/doctorRoutes.js";
import maufactureRoutes from "./routes/manufacturerRoutes.js";
import b2bRoutes from "./routes/b2bCategory.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import bioburgJewelersRoutes from "./routes/bioburgJewelers.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import homeSliderRoutes from "./routes/homeSliderRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";

import franchiseRoutes from "./routes/franchiseRoutes.js";
import franchiseAuthRoutes from "./routes/franchiseAuthRoutes.js";
import franchiseProfileRoutes from "./routes/franchiseProfileRoutes.js";

import vendorOrdersRoutes from "./routes/vendor/vendorOrders.routes.js";
import vendorProductsRoutes from "./routes/vendor/vendorProducts.routes.js";
import vendorAnalyticsRoutes from "./routes/vendor/vendorAnalytics.routes.js";
import vendorDashboardRoutes from "./routes/vendor/vendorDashboard.routes.js";
import vendorAuthRoutes from "./routes/vendor/vendorAuth.routes.js";
import vendorProfileRoutes from "./routes/vendor/vendorProfileroutes.js";
import vendorPaymentRoutes from "./routes/vendor/vendorPayments.routes.js";

import partnerRoutes from "./routes/radiology/partner.routes.js";
import RadiologyAdminRoutes from "./routes/radiology/radiology.admin.routes.js";
import authRoutes from "./routes/radiology/auth.routes.js";
import partnerDashboardRoutes from "./routes/radiology/partnerDashboard.routes.js";

import labRoutes from "./routes/pathology/labRoutes.js";
import labAuthRoutes from "./routes/pathology/labauthRoutes.js";
import testRoutes from "./routes/pathology/testRoutes.js";
import bookingRoutes from "./routes/pathology/bookingRoutes.js";
import reportRoutes from "./routes/pathology/reportRoutes.js";

import zoneRoutes from "./routes/zoneRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import bulkManufacturingRoutes from "./routes/bulkManufacturingRoutes.js";
import bulkManufacturingAuthRoutes from "./routes/bulkManufacturingAuthRoutes.js";
import bulkManufacturingPortalRoutes from "./routes/bulkManufacturingPortalRoutes.js";
import jobsandcarrerRoutes from "./routes/jobsCareers.js";
import jobManageRoutes from "./routes/jobManage.js";
import exServiceJobRoutes from "./routes/Exservicejob.js";
import exServiceSupportRoutes from "./routes/Exservicesupportroutes.js";
import JobsSupportRoutes from "./routes/Jobssupportroutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import popupVideoRoutes from "./routes/popupVideoRoutes.js";
import trainingRoutes from "./routes/TrainingRoutes.js";
import saleOrderRoutes from "./routes/Saleorderroutes.js";
import pointsPayoutRoutes from "./routes/Pointspayoutroutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import geoTrackingRoutes from "./routes/geoTrackingRoutes.js";
import routePlanningRoutes from "./routes/routePlanningRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import dailyExpensesRoutes from "./routes/dailyExpensesRoutes.js";
import campaignRoutes from "./routes/campaignRoute.js";
import adminVisualAdsRoutes from "./routes/adminVisualAds.routes.js";
import calendarEventRoutes from "./routes/calendarEvent.js";
import followUpRoutes from "./routes/pendingFollowup.js"
import employeeIdRoutes from "./routes/employeeIdCardRoutes.js";
import targetRoutes from "./routes/targetRoutes.js";
import topPerformerRoutes from "./routes/topPerformerRoutes.js";
import giftRoutes from "./routes/giftRoutes.js";
import productFeedbackRoutes from "./routes/pfRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 300000);
const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const allowedOrigins = [
  "https://bioburglifesciences.in",
  "https://www.bioburglifesciences.in",
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://bioburglifescience-1.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      const isAllowedLocalOrigin = LOCAL_ORIGIN_PATTERN.test(origin || "");

      if (!origin || allowedOrigins.includes(origin) || isAllowedLocalOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS);
  res.setTimeout(REQUEST_TIMEOUT_MS);
  next();
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

const server = http.createServer(app);
initSocket(server);

const uploadPath = path.join(__dirname, "uploads");
const safeUploadPath =
  process.env.NODE_ENV === "production" ? "/tmp/uploads" : uploadPath;

if (!fs.existsSync(safeUploadPath)) {
  fs.mkdirSync(safeUploadPath, { recursive: true });
}

app.use("/uploads", express.static(safeUploadPath));

const resumePath = path.join(safeUploadPath, "resumes");
if (!fs.existsSync(resumePath)) {
  fs.mkdirSync(resumePath, { recursive: true });
}
app.use("/agent/campaigns", campaignRoutes);
app.use("/api/marketing-agent", marketingAgentRoutes);
app.use("/api/agent", marketingAgentRoutes); 
app.use("/api/sale-orders", saleOrderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/delivery/admin", deliveryAdminRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/delivery/old", deliveryAgentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", policyRoutes);

app.use('/api/daily-plan', dailyPlanRoutes);
app.use("/api/calendar", calendarEventRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/marketing-agent", saleBillRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/points", pointsPayoutRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/geo-tracking", geoTrackingRoutes);
app.use("/api/route-planning", routePlanningRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/expenses", dailyExpensesRoutes);
app.use("/api/employee-id-cards", employeeIdRoutes);
app.use("/api/targets", targetRoutes);
app.use("/api/top-performers", topPerformerRoutes);
app.use("/api/agent/gifts", giftRoutes);
app.use("/api/public", productFeedbackRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminRegistrationsRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/admin", adminFranchiseRoutes);
app.use("/api/admin", adminProductsRoutes);
app.use("/api/admin", adminVendorAnalyticsRoutes);
app.use("/api/admin", adminVendorDashboardRoutes);
app.use("/api/admin", adminDoctorRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/consultations", adminConsultationRoutes);
app.use("/api/admin/orders", orderAdminRoutes);
app.use("/api/admin/pathology", adminPathologyRoutes);
app.use("/api/admin/manufacturers", adminManufacturerRoutes);
app.use("/api/admin/bulk-manufacturing", adminBulkManufacturingRoutes);
app.use("/api/admin/visual-ads", adminVisualAdsRoutes);
app.use("/api/admin-order", adminOrdersRoutes);
app.use("/api/products", productDetailsRoutes);
app.use("/api/popup-video", popupVideoRoutes);

app.use("/api/cards", cardroutes);
app.use("/api/categories", AllCategoryRoutes);
app.use("/api/launches", LaunchRoutes);
app.use("/api/trends", TrendRoute);
app.use("/api/brands", BrandRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/deals", DealRoutes);
app.use("/api/banners", BannerRoutes);
app.use("/api/health-articles", healthArticleRoutes);
app.use("/api/user", UserRoute);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/testimonial", testimonialRoutes);
app.use("/api/labtest", labTestRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/manufacturer", maufactureRoutes);
app.use("/api/b2b", b2bRoutes);
app.use("/api/BioburgJewelers", bioburgJewelersRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", cmsRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/home-sliders", homeSliderRoutes);

app.use("/api/franchise", franchiseRoutes);
app.use("/api/franchise", franchiseProfileRoutes);
app.use("/api/franchise-auth", franchiseAuthRoutes);

app.use("/api/vendor", vendorOrdersRoutes);
app.use("/api/vendor", vendorProductsRoutes);
app.use("/api/vendor", vendorAnalyticsRoutes);
app.use("/api/vendor", vendorDashboardRoutes);
app.use("/api/vendor/admin", adminVendorRoutes);
app.use("/api/vendor", vendorAuthRoutes);
app.use("/api/vendor", vendorProfileRoutes);
app.use("/api/vendor",vendorPaymentRoutes);

app.use("/api/partners", partnerRoutes);
app.use("/api/radiology/admin", RadiologyAdminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/partner", partnerDashboardRoutes);

app.use("/api/labs", labRoutes);
app.use("/api/auth", labAuthRoutes);
app.use("/api/lab-tests", testRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reports", reportRoutes);

app.use("/api/zones", zoneRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/bulk-manufacturing", bulkManufacturingRoutes);
app.use("/api/bulk-manufacturing-auth", bulkManufacturingAuthRoutes);
app.use("/api/bulk-manufacturing-portal", bulkManufacturingPortalRoutes);

app.use("/api/jobs-careers", jobsandcarrerRoutes);
app.use("/api/jobs-manage", jobManageRoutes);
app.use("/api/exservice-jobs", exServiceJobRoutes);
app.use("/api/exservice-support", exServiceSupportRoutes);
app.use("/api/jobs-support", JobsSupportRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use(errorHandler);

const PORT = process.env.PORT || 8000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running with Socket on PORT: ${PORT}`);
  });
});
