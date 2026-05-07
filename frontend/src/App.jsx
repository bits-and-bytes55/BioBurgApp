import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { isLoggedIn } from "../utils/auth";
import MainNavbar from "./components/Navbar";
import { NavProvider } from "./context/NavContext";
// import MainFooter from "./components/Footer";
import UserNavbar from "./UserPanel/UserNabvar";
// import UserFooter from "./UserPanel/UserFooter";
import Footer from "./components/Footer";

import Home from "./components/Home";
import ProductDetail from "./components/ProductDetail";
import CategoryPage from "./pages/CategoryPage";
import ProductQrDetails from "./pages/ProductQrDetails";

// AUTH
import AdminLogin from "./adminpanel/AdminLogin";
import AdminRegister from "./adminpanel/diagnostics/AdminRegister.jsx";
import Dashboard from "./adminpanel/dashboard.jsx";

//  HUBS
import LoginHub from "./components/LoginHub.jsx";
import SignupHub from "./components/SignupHub.jsx";

// USER
import Userregister from "./UserPanel/Userregister";
import Userlogin from "./UserPanel/Userlogin";
import Userprofile from "./UserPanel/Userprofile";

// VENDOR
import VendorLogin from "./VendorPanel/VendorLogin.jsx";
import VendorRegister from "./VendorPanel/VendorRegister.jsx";
import VendorLayout from "./VendorPanel/pages/VendorLayout";
import { VendorProvider } from "./VendorPanel/context/VendorContext";
import VendorDashboard from "./VendorPanel/pages/VendorDashboard.jsx";
import VendorOrders from "./VendorPanel/pages/VendorOrders.jsx";
import VendorProducts from "./VendorPanel/pages/VendorProducts.jsx";
import VendorPayments from "./VendorPanel/pages/VendorPayments.jsx";
import VendorAnalytics from "./VendorPanel/pages/VendorAnalytics.jsx";
import VendorProfile from "./VendorPanel/pages/VendorProfile.jsx";

// DOCTOR
import DoctorRegistrationForm from "./e-consultation/DoctorRegistrationForm.jsx";
import DoctorLogin from "./e-consultation/DoctorLogin.jsx";
import DoctorLayout from "./e-consultation/doctors/DoctorLayout.jsx";
import DoctorDashboard from "./e-consultation/doctors/DoctorDashboard.jsx";
import DoctorAvailability from "./e-consultation/doctors/Availability.jsx";
import DoctorConsultations from "./e-consultation/doctors/Consultations.jsx";
import DoctorProfile from "./e-consultation/doctors/DoctorProfile.jsx";
import DoctorPrescriptions from "./e-consultation/doctors/Prescriptions.jsx";
import Wallet from "./e-consultation/doctors/Wallet.jsx";

// MANUFACTURER
import ManufacturerLogin from "./PharmaManufacture/ManufacturerLogin";
import PharmaManufacturerForm from "./PharmaManufacture/PharmaManufacturerForm.jsx";
import ManufacturerLayout from "./PharmaManufacture/pages/ManufacturerLayout";
import ManufacturerDashboard from "./PharmaManufacture/pages/ManufacturerDashboard";
import ManufacturerProfile from "./PharmaManufacture/pages/ManufacturerProfile";
import ManufacturerProducts from "./PharmaManufacture/pages/ManufacturerProducts";
import ManufacturerOrders from "./PharmaManufacture/pages/ManufacturerOrders";
import ManufacturerPayments from "./PharmaManufacture/pages/ManufacturerPayments";
import ManufacturerSettings from "./PharmaManufacture/pages/ManufacturerSettings";
import ProtectedManufacturerRoute from "./PharmaManufacture/components/ProtectedRoute.jsx";
import BulkManufacturingForm from "./BulkManufacture/BulkManufacturingForm.jsx";
import BulkManufacturingLogin from "./BulkManufacture/pages/BulkManufacturingLogin.jsx";
import BulkManufacturingLayout from "./BulkManufacture/layout/BulkManufacturingLayout.jsx";
import BulkManufacturingDashboard from "./BulkManufacture/pages/DashboardHome.jsx";
import BulkManufacturingOrders from "./BulkManufacture/pages/Orders.jsx";
import BulkManufacturingProducts from "./BulkManufacture/pages/Products.jsx";
import BulkManufacturingRequirements from "./BulkManufacture/pages/Requirements.jsx";
import BulkManufacturingDocuments from "./BulkManufacture/pages/Documents.jsx";
import BulkManufacturingProfile from "./BulkManufacture/pages/Profile.jsx";
import ProtectedBulkManufacturingRoute from "./BulkManufacture/components/ProtectedRoute.jsx";

// ORDERS
import OrderTracking from "./UserPanel/pages/dashboard/OrderTracking.jsx";
import Cart from "./UserPanel/pages/dashboard/Cart.jsx";
import Checkout from "./UserPanel/pages/dashboard/Checkout.jsx";
import OrderSuccess from "./UserPanel/pages/dashboard/OrderSuccess.jsx";
import Orders from "./UserPanel/pages/dashboard/Orders.jsx";
import OrderDetails from "./UserPanel/pages/dashboard/OrderDetails.jsx";
import CMSPages from "./adminpanel/pages/CMSPages.jsx";
import CMSPageEditor from "./adminpanel/pages/CMSPageEditor.jsx";

// Marketing Agent
import AgentLogin from "./marketingAgent/AgentLogin";
import AgentRegister from "./marketingAgent/AgentRegister";
import AgentDashboard from "./marketingAgent/pages/Dashboard.jsx";
import AgentProtectedRoute from "./components/AgentProtectedRoute";
import JobActivity from "./marketingAgent/pages/JobActivity.jsx";
import Responses from "./marketingAgent/pages/Responses.jsx";
import TrainingMeeting from "./marketingAgent/pages/Training&Metting.jsx";
import Leads from "./marketingAgent/pages/Leads.jsx";
import Commission from "./marketingAgent/pages/Commission.jsx";
import AgentLayout from "./marketingAgent/layout/AgentLayout.jsx";
import Profile from "./marketingAgent/pages/Profile.jsx";
import StartJob from "./marketingAgent/pages/StartJob.jsx";
import JobHistory from "./marketingAgent/pages/JobHistory.jsx";
import AgentCreateOrder  from "./marketingAgent/pages/Order.jsx"
import Products from "./marketingAgent/pages/Products.jsx";
import Invoices from "./marketingAgent/pages/Invoices.jsx";
import PaymentHistory from "./marketingAgent/pages/PaymentHistory.jsx";
import BioBurgPayments from "./marketingAgent/pages/bioburgpayments.jsx";
import PointsAndPayout from "./marketingAgent/pages/Points&Payout.jsx";
import NewDCR        from "./marketingAgent/pages/Newdcr.jsx";
import DCRHistory    from "./marketingAgent/pages/Dcrhistory.jsx";
import EndOfDay      from "./marketingAgent/pages/Endofday.jsx";
import WorkingPlan   from "./marketingAgent/pages/Workingplan.jsx";
import GeoTracking   from "./marketingAgent/pages/Geotracking.jsx";
import DailyExpenses from "./marketingAgent/pages/Dailyexpenses.jsx";
import Presentations from "./marketingAgent/pages/Presentations.jsx"
import TargetManagement from "./marketingAgent/pages/Targetmanagement.jsx";
import Reports       from "./marketingAgent/pages/Reports.jsx";
import Gallery       from "./marketingAgent/pages/Gallery.jsx";
import CompanyCalendar from "./marketingAgent/pages/Companycalendar.jsx";
import Routeplanning from "./marketingAgent/pages/Routeplanning.jsx";
import WorkPerformance from "./marketingAgent/pages/workPerformance.jsx";
import CampaignManagement from "./marketingAgent/pages/campaignManagement.jsx";
import VisualAds from "./marketingAgent/pages/VisualAds";
import MarketingChart from "./marketingAgent/pages/MarketingChart.jsx";
import MRPerfromanceChart from "./marketingAgent/pages/MRPerformanceChart.jsx";
import Appointment   from "./marketingAgent/pages/satffappointment.jsx";
import StaffList     from "./marketingAgent/pages/stafflist.jsx";
import WorkingStatus from "./marketingAgent/pages/statffworkingstatus.jsx";
import SupportTickets from "./marketingAgent/pages/supportTickets.jsx";
import WorkflowStatus from "./marketingAgent/pages/workflowStatus.jsx";
import PendingFollowUps from "./marketingAgent/pages/pendingFollowups.jsx";
import TopPerformers from "./marketingAgent/pages/topPerformers.jsx";
import GiftManagement from "./marketingAgent/pages/giftManagement.jsx";
import ProductsFeedback from "./marketingAgent/pages/productFeedback.jsx";

// Delivery Agent
import DeliveryAgentLogin from "./DeliveryAgent/DeliveryAgentLogin";
import DeliveryAgentRegister from "./DeliveryAgent/DeliveryAgentRegister";
import DeliveryAgentProtectedRoute from "./components/DeliveryAgentProtectedRoute";
import DeliveryAgentDashboard from "./DeliveryAgent/pages/DeliveryAgentDashboard.jsx";
import DeliveryAgentLayout from "./DeliveryAgent/layout/AgentLayout.jsx";
import DeliveryLeads from "./DeliveryAgent/pages/Leads.jsx";
import DeliveryCampaigns from "./DeliveryAgent/pages/Campaigns.jsx";
import DeliveryVendors from "./DeliveryAgent/pages/Vendors.jsx";
import DeliveryReports from "./DeliveryAgent/pages/Reports.jsx";
import DeliveryCommission from "./DeliveryAgent/pages/Commission.jsx";
import AgentProfile from "./DeliveryAgent/pages/AgentProfile.jsx";

// Radiology
import RadiologyDiagnosticsForm from "./Radiology/pages/RadiologyDiagnosticsForm.jsx";
import PartnerLogin from "./Radiology/pages/PartnerLogin";
import PartnerLayout from "./Radiology/layout/PartnerLayout";
import PartnerDashboard from "./Radiology/pages/partner/DashboardHome";

// Franchise
import FranchiseForm from "./Franchise/pages/FranchiseForm.jsx";
import FranchiseLogin from "./Franchise/pages/FranchiseLogin.jsx";
import FranchiseLayout from "./Franchise/layout/FranchiseLayout.jsx";
import DashboardHome from "./Franchise/pages/DashboardHome.jsx";
import FranchiseProducts from "./Franchise/pages/FranchiseProducts.jsx";
import FranchiseOrders from "./Franchise/pages/franchiseorders.jsx";
import FranchiseOrderDetails from "./Franchise/pages/FranchiseOrderDetails.jsx";
import FranchiseSalesReport from "./Franchise/pages/FranchiseSalesReport.jsx";
import FranchisePayments from "./Franchise/pages/franchisepayments.jsx";
import FranchiseInventory from "./Franchise/pages/franchiseinventory.jsx";
import FranchiseSupportList from "./Franchise/pages/support/FranchiseSupportList.jsx";
import FranchiseCreateTicket from "./Franchise/pages/support/FranchiseCreateTicket.jsx";
import FranchiseSupportDetails from "./Franchise/pages/support/FranchiseSupportDetails.jsx";
import FranchiseProfile from "./Franchise/pages/FranchiseProfile.jsx";
import ProtectedFranchiseRoute from "./Franchise/components/ProtectedRoute.jsx";

// Pathology
import Pathologylabtest from "./pathology/pathologyregister.jsx";
import Pathologylablogin from "./pathology/pathologyLogin.jsx";
import LabLayout from "./pathology/layout/lablayout.jsx";
import LabDashboardHome from "./pathology/pages/lab/DashboardHome.jsx";
import LabProfile from "./pathology/pages/lab/Profile.jsx";
import LabTests from "./pathology/pages/lab/Tests.jsx";
import LabBookings from "./pathology/pages/lab/Bookings.jsx";
import LabReports from "./pathology/pages/lab/Reports.jsx";

//HOSPITAL
import HospitalLanding from "./Hospital/HospitalLanding.jsx";
import HospitalLogin from "./Hospital/HospitalLogin.jsx";
import HospitalRegistration from "./Hospital/HospitalRegistration.jsx";
import HospitalLayout from "./Hospital/HospitalLayout.jsx";
import HospitalDashboard from "./Hospital/HospitalDashboard.jsx";
//PHARMACY
import PharmacyLanding from "./Pharmacy/Pharmacylanding.jsx";
import PharmacyLogin from "./Pharmacy/Pharmacylogin.jsx";
import PharmacyRegistration from "./Pharmacy/Pharmacyregistration.jsx";
import PharmacyLayout from "./Pharmacy/Pharmacylayout.jsx";
import PharmacyDashboard from "./Pharmacy/Pharmacydashboard.jsx";

//BackBanner
import PortalBackBanner from "./components/PortalBackBanner";

//Delivery Zone
import DeliverySignup from "./Delivery/DeliverySignup";
import DeliveryLogin from "./Delivery/DeliveryLogin";
import DeliveryDashboard from "./Delivery/DeliveryDashboard.jsx";

import JobsAndCareersRegister from "./jobs&careers/CareersApplicationForm.jsx";
import CareersPage from "./jobs&careers/Careerspage.jsx";
import JobDetailPage from "./jobs&careers/JobDetailPage.jsx";
import ExServiceRegisterForm from "./Ex-Serviceman/Exserviceregisterform.jsx";
import ExServiceCareersPage from "./Ex-Serviceman/Exservicecareerspage.jsx";
import ExServiceJobDetailPage from "./Ex-Serviceman/Exservicejobdetailpage.jsx";
import OnlineTest from "./adminpanel/pages/OnlineTest.jsx";
import PolicyPage from "./pages/PolicyPage";
import PopupVideoPlayer from "./components/PopupVideoPlayer";
import ConsultationPage from "./components/ConsultationPage";
import RadiologyDiagnosticsTest from "./components/RadiologyDiagnosticTest";
import Pathologylabpage from "./components/Pathologyregister";

function LayoutWrapper({ children }) {
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  // Also treat vendor / hospital / pharmacy sessions as "logged in" for navbar
  const anyLoggedIn = isLoggedIn || isAnyTokenPresent();

  const hideLayoutRoutes = [
    "/admin",
    "/vendor",
    "/agent",
    "/doctor",
    "/manufacturer",
    "/delivery",
    "/hospital/dashboard",
    "/pharmacy/dashboard",
    "/partner",
  ];

  const hideLayout =
    hideLayoutRoutes.some((path) => location.pathname.startsWith(path)) ||
    location.pathname === "/franchise" ||
    location.pathname.startsWith("/franchise/") ||
    location.pathname === "/bulk-manufacturing" ||
    location.pathname.startsWith("/bulk-manufacturing/");

  return (
    <>
      <PopupVideoPlayer />
      <PortalBackBanner />
      {!hideLayout && (anyLoggedIn ? <UserNavbar /> : <MainNavbar />)}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}

function isAnyTokenPresent() {
  return !!(
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("vendorToken") ||
    localStorage.getItem("hospitalToken") ||
    localStorage.getItem("pharmacyToken") ||
    localStorage.getItem("doctorToken")
  );
}
function VendorProtectedRoute({ children }) {
  if (!isLoggedIn("vendor")) {
    return <Navigate to="/login/vendor" replace />;
  }
  return children;
}
function App() {
  const userToken = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");

  return (
    <AuthProvider>
      <Router>
        <NavProvider>
          <Toaster position="top-center" />

          <LayoutWrapper>
            <Routes>
              {/* PUBLIC */}
              <Route path="/" element={<Home />} />
              <Route path="/policy/:slug" element={<PolicyPage />} />
              <Route path="/category/:id" element={<CategoryPage />} />
              <Route path="/categories/:id" element={<CategoryPage />} />
              <Route path="/product-details/:id" element={<ProductDetail />} />
              <Route path="/product-qr/:token" element={<ProductQrDetails />} />

              {/* HUBS */}
              <Route path="/login" element={<LoginHub />} />
              <Route path="/signup" element={<SignupHub />} />
              <Route
                path="/register/bulk-manufacturing"
                element={<BulkManufacturingForm />}
              />
              <Route
                path="/bulk-manufacturing/login"
                element={<BulkManufacturingLogin />}
              />
              <Route
                path="/bulk-manufacturing"
                element={
                  <ProtectedBulkManufacturingRoute>
                    <BulkManufacturingLayout />
                  </ProtectedBulkManufacturingRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route
                  path="dashboard"
                  element={<BulkManufacturingDashboard />}
                />
                <Route
                  path="products"
                  element={<BulkManufacturingProducts />}
                />
                <Route path="orders" element={<BulkManufacturingOrders />} />
                <Route
                  path="requirements"
                  element={<BulkManufacturingRequirements />}
                />
                <Route
                  path="documents"
                  element={<BulkManufacturingDocuments />}
                />
                <Route path="profile" element={<BulkManufacturingProfile />} />
              </Route>

              {/* USER */}
              <Route path="/userregister" element={<Userregister />} />
              <Route path="/userlogin" element={<Userlogin />} />
              <Route
                path="/userprofile"
                element={
                  userToken ? <Userprofile /> : <Navigate to="/userlogin" />
                }
              />

              {/* ADMIN */}
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin-register" element={<AdminRegister />} />
              <Route
                path="/admin/dashboard"
                element={
                  adminToken ? <Dashboard /> : <Navigate to="/admin-login" />
                }
              />
              <Route path="/admin/cms" element={<CMSPages />} />
              <Route path="/admin/cms/:slug" element={<CMSPageEditor />} />

              {/* VENDOR */}
              <Route path="/login/vendor" element={<VendorLogin />} />
              <Route path="/register/vendor" element={<VendorRegister />} />
              <Route
                path="/vendor"
                element={
                  <VendorProtectedRoute>
                    <VendorProvider>
                      <VendorLayout />
                    </VendorProvider>
                  </VendorProtectedRoute>
                }
              >
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="orders" element={<VendorOrders />} />
                <Route path="products" element={<VendorProducts />} />
                <Route path="payments" element={<VendorPayments />} />
                <Route path="analytics" element={<VendorAnalytics />} />
                <Route path="profile" element={<VendorProfile />} />
              </Route>

              <Route path="/consultation" element={<ConsultationPage />} />
              <Route path="/book-lab-test" element={<Pathologylabpage />} />
              <Route
                path="/register/radiology-diagnosticstest"
                element={<RadiologyDiagnosticsTest />}
              />

              {/* DOCTOR */}

              <Route
                path="/register/doctor"
                element={<DoctorRegistrationForm />}
              />
              <Route path="/login/doctor" element={<DoctorLogin />} />
              <Route path="/doctor" element={<DoctorLayout />}>
                <Route index element={<DoctorDashboard />} />
                <Route path="profile" element={<DoctorProfile />} />
                <Route path="availability" element={<DoctorAvailability />} />
                <Route path="consultations" element={<DoctorConsultations />} />
                <Route path="prescriptions" element={<DoctorPrescriptions />} />
                <Route path="wallet" element={<Wallet />} />
              </Route>

              {/* HOSPITAL */}
              <Route path="/hospital" element={<HospitalLanding />} />
              <Route path="/hospital/login" element={<HospitalLogin />} />
              <Route
                path="/register/hospital"
                element={<HospitalRegistration />}
              />
              <Route path="/hospital/dashboard" element={<HospitalLayout />}>
                <Route index element={<HospitalDashboard />} />
              </Route>

              {/* PHARMACY */}
              <Route path="/pharmacy" element={<PharmacyLanding />} />
              <Route path="/pharmacy/login" element={<PharmacyLogin />} />
              <Route
                path="/register/pharmacy"
                element={<PharmacyRegistration />}
              />
              <Route path="/pharmacy/dashboard" element={<PharmacyLayout />}>
                <Route index element={<PharmacyDashboard />} />
              </Route>

              {/* Delivery Zone */}
              <Route path="/delivery/signup" element={<DeliverySignup />} />
              <Route path="/delivery/login" element={<DeliveryLogin />} />
              <Route
                path="/delivery/dashboard"
                element={<DeliveryDashboard />}
              />

              {/* MANUFACTURER */}
              <Route
                path="/login/manufacturer"
                element={<ManufacturerLogin />}
              />
              <Route
                path="/register/pharma-manufacturer"
                element={<PharmaManufacturerForm />}
              />
              <Route
                path="/manufacturer"
                element={
                  <ProtectedManufacturerRoute>
                    <ManufacturerLayout />
                  </ProtectedManufacturerRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ManufacturerDashboard />} />
                <Route path="profile" element={<ManufacturerProfile />} />
                <Route path="products" element={<ManufacturerProducts />} />
                <Route path="orders" element={<ManufacturerOrders />} />
                <Route path="payments" element={<ManufacturerPayments />} />
                <Route path="settings" element={<ManufacturerSettings />} />
              </Route>

              {/* ORDERS */}
              <Route
                path="/orders/track/:orderId"
                element={<OrderTracking />}
              />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route
                path="/orders/success/:orderId"
                element={<OrderSuccess />}
              />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:orderId" element={<OrderDetails />} />

              {/* MARKETING AGENT */}
              <Route path="/agent/login" element={<AgentLogin />} />
              <Route path="/agent/register" element={<AgentRegister />} />
              <Route
  path="/agent"
  element={
    <AgentProtectedRoute>
      <AgentLayout />
    </AgentProtectedRoute>
  }
>
  <Route path="marketing" element={<CampaignManagement/>}></Route> 
  <Route path="leads"     element={<Leads />} />
  <Route path="visual-ads" element={<VisualAds />} />
  <Route path="workflow-status" element={<WorkflowStatus/>} />
  <Route path="support-tickets" element={<SupportTickets/>} />
  <Route path="marketing-chart" element={<MarketingChart/>} />
  <Route path="mr-chart" element={<MRPerfromanceChart/>} />

  {/* ── Main ── */}
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard"           element={<AgentDashboard />} />
 
  {/* ── Field Work ── */}
  <Route path="job-activity"        element={<JobActivity />} />
  <Route path="start-job"           element={<StartJob />} />
  <Route path="job-history"         element={<JobHistory />} />
  <Route path="responses"           element={<Responses />} />
  <Route path="daily-expenses"      element={<DailyExpenses />} />
  <Route path="geo-tracking"        element={<GeoTracking />} />
 
  {/* DCR */}
  <Route path="dcr">
    <Route path="new"               element={<NewDCR />} />
    <Route path="history"           element={<DCRHistory />} />
    <Route path="eod"               element={<EndOfDay />} />
  </Route>
 
  {/* Working Plans */}
  <Route path="plan">
    <Route path="daily"       element={<WorkingPlan planTypeKey="daily"       />} />
    <Route path="weekly"      element={<WorkingPlan planTypeKey="weekly"      />} />
    <Route path="fortnightly" element={<WorkingPlan planTypeKey="fortnightly" />} />
    <Route path="monthly"     element={<WorkingPlan planTypeKey="monthly"     />} />
    <Route path="pjp"         element={<WorkingPlan planTypeKey="station"     />} />
    <Route path="stp"         element={<WorkingPlan planTypeKey="outstations" />} />
  </Route>
 
 
  {/* ── Products ── */}
  <Route path="products"            element={<Products />} />
  <Route path="giftmanagement"      element={<GiftManagement />} />
  <Route path="feedback"      element={<ProductsFeedback />} />
  <Route path="edetailing">
    <Route path="presentations"     element={<Presentations />} />
    {/* slide analytics, 3D aids — add pages here */}
  </Route>
 
  {/* ── Orders & Billing ── */}
  <Route path="orders">
    <Route path="create-bill"       element={<AgentCreateOrder />} />
  </Route>

      <Route path="billing/invoices"        element={<Invoices />} />
      <Route path="hr/payment-history"      element={<PaymentHistory />} />
      <Route path="billing/bioburg-payments" element={<BioBurgPayments />} />
 
  {/* ── Marketing ── */}
  <Route path="commission"          element={<Commission />} />
 
  {/* ── Targets & Incentives ── */}
  <Route path="targets">
    <Route path="monthly"           element={<TargetManagement />} />
    <Route path="leaderboard"       element={<TopPerformers />} />
  </Route>
  {/* <Route path="incentives">
    <Route path="calculation"       element={<Incentives />} />
    <Route path="promotion"         element={<Incentives />} />
  </Route> */}
 
  {/* ── Growth ── */}
  <Route path="points-payout"       element={<PointsAndPayout />} />
 

 <Route path="hr">
  <Route path="appointment"   element={<Appointment />} />
  <Route path="staff-list"    element={<StaffList />} />
  <Route path="working-status" element={<WorkingStatus />} />
  {/* Payroll */}
  <Route path="payslips"        element={<Reports />} />
  <Route path="payment-history" element={<PaymentHistory />} />
  {/* Other HR */}
  <Route path="recruitment"     element={<Reports />} />
  <Route path="hierarchy"       element={<Reports />} />
</Route>

  {/* ── Reports ── */}
  <Route path="reports">
    <Route path="dcr"               element={<Reports />} />
    <Route path="monthly-sales"     element={<Reports />} />
    <Route path="product-sales"     element={<Reports />} />
    <Route path="doctor-coverage"   element={<Reports />} />
    <Route path="chemist-coverage"  element={<Reports />} />
    <Route path="mr-performance"    element={<Reports />} />
    <Route path="incentives"        element={<Reports />} />
    <Route path="samples"           element={<Reports />} />
    <Route path="work-profile"      element={<Reports />} />
    <Route path="marketing-chart"   element={<Reports />} />
    <Route path="mr-chart"          element={<Reports />} />
  </Route>
 
  {/* ── Gallery & Media ── */}
  <Route path="gallery">
    <Route path="photos"            element={<Gallery />} />
    <Route path="videos"            element={<Gallery />} />
    <Route path="awards"            element={<Gallery />} />
    <Route path="social"            element={<Gallery />} />
    <Route path="field-upload"      element={<Gallery />} />
  </Route>
  <Route path="news"                element={<Gallery />} />
 
  {/* ── Calendar ── */}
  <Route path="calendar">
    <Route path="company"           element={<CompanyCalendar />} />
    <Route path="follow-ups"           element={<PendingFollowUps />} />
  </Route>

  {/* Routing  */}
    <Route path="route-planning"          element={<Routeplanning />} /> 

    {/* Work Performance */}
    <Route path="work-performance"        element={<WorkPerformance/>} />
 
  {/* ── Learning ── */}
  <Route path="training-meeting"    element={<TrainingMeeting />} />
 
  {/* ── Account ── */}
  <Route path="profile"             element={<Profile />} />
</Route>

              {/* DELIVERY AGENT */}
              <Route
                path="/delivery-agent/login"
                element={<DeliveryAgentLogin />}
              />
              <Route
                path="/delivery-agent/register"
                element={<DeliveryAgentRegister />}
              />
              <Route
                path="/delivery-agent"
                element={
                  <DeliveryAgentProtectedRoute>
                    <DeliveryAgentLayout />
                  </DeliveryAgentProtectedRoute>
                }
              >
                <Route
                  path="delivery-dashboard"
                  element={<DeliveryAgentDashboard />}
                />
                <Route path="delivery-leads" element={<DeliveryLeads />} />
                <Route path="delivery-vendors" element={<DeliveryVendors />} />
                <Route
                  path="delivery-campaigns"
                  element={<DeliveryCampaigns />}
                />
                <Route path="delivery-reports" element={<DeliveryReports />} />
                <Route
                  path="delivery-commission"
                  element={<DeliveryCommission />}
                />
                <Route path="delivery-profile" element={<AgentProfile />} />
              </Route>

              {/* Jobs and Carrers  */}
              <Route
                path="/register/jobs-careers"
                element={<JobsAndCareersRegister />}
              />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/careers/:id" element={<JobDetailPage />} />
              <Route
                path="/register/exservice"
                element={<ExServiceRegisterForm />}
              />
              <Route
                path="/exservice/jobs"
                element={<ExServiceCareersPage />}
              />
              <Route
                path="/exservice/jobs/:id"
                element={<ExServiceJobDetailPage />}
              />
              <Route path="/test/:token" element={<OnlineTest />} />

              {/* FRANCHISE */}
              <Route
                path="/franchise-application"
                element={<FranchiseForm />}
              />
              <Route path="/franchise/login" element={<FranchiseLogin />} />
              <Route
                path="/franchise"
                element={
                  <ProtectedFranchiseRoute>
                    <FranchiseLayout />
                  </ProtectedFranchiseRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardHome />} />
                <Route path="products" element={<FranchiseProducts />} />
                <Route path="orders" element={<FranchiseOrders />} />
                <Route path="reports" element={<FranchiseSalesReport />} />
                <Route path="payments" element={<FranchisePayments />} />
                <Route path="inventory" element={<FranchiseInventory />} />
                <Route path="support" element={<FranchiseSupportList />} />
                <Route
                  path="support/create"
                  element={<FranchiseCreateTicket />}
                />
                <Route
                  path="support/:id"
                  element={<FranchiseSupportDetails />}
                />
                <Route path="profile" element={<FranchiseProfile />} />
                <Route path="orders/:id" element={<FranchiseOrderDetails />} />
              </Route>

              {/* RADIOLOGY */}
              <Route
                path="/register/radiology-diagnostics"
                element={<RadiologyDiagnosticsForm />}
              />
              <Route path="/partner/login" element={<PartnerLogin />} />
              <Route path="/partner" element={<PartnerLayout />}>
              <Route path="dashboard" element={<PartnerDashboard />} />
              </Route>

              {/* PATHOLOGY */}
              <Route path="/book-lab-test" element={<Pathologylabtest />} />
              <Route path="/pathology-login" element={<Pathologylablogin />} />
              <Route path="/lab" element={<LabLayout />}>
                <Route path="dashboard" element={<LabDashboardHome />} />
                <Route path="profile" element={<LabProfile />} />
                <Route path="tests" element={<LabTests />} />
                <Route path="bookings" element={<LabBookings />} />
                <Route path="reports" element={<LabReports />} />
              </Route>

              {/* FALLBACK */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </LayoutWrapper>
        </NavProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
