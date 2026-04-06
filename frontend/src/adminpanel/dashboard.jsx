import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Drawer,
  Avatar,
  Collapse,
  IconButton,
  Divider,
  Paper,
  CircularProgress,
} from "@mui/material";

import {
  Menu as MenuIcon,
  DashboardCustomizeOutlined as DashboardIcon,
  Inventory2Outlined as InventoryIcon,
  CategoryOutlined as CategoryIcon,
  ExpandLess,
  ExpandMore,
  PeopleAltOutlined as PeopleIcon,
  ShoppingCartOutlined as CartIcon,
  AddBusinessOutlined as AddBusinessIcon,
  Launch as LaunchIcon,
  TrendingUp as TrendingIcon,
  Storefront as StorefrontIcon,
  LocalOffer as LocalOfferIcon,
  PhotoLibrary as PhotoLibraryIcon,
  ArticleOutlined as ArticleIcon,
  RateReviewOutlined as TestimonialIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";

import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadialBarChart,
  RadialBar,
} from "recharts";

// your components
import AdminNavManager from "./Adminnavmanager";
import PoliciesManager from "./PolicyManager";
import CardForm from "../components/CardForm";
import AllCategories from "../components/AllCategories";
import BannerForm from "../components/BannerForm";
import AdminHomeSlider from "../adminpanel/pages/AdminHomeSlider";
import HealthArticleForm from "../components/HealthArticleForm";
import CreateTestimonial from "./pages/CreateTestimonial";
import AddProductForm from "../components/AddProductForm";
import AdminAllProduct from "../components/AllProducts";
import EditProductForm from "../components/EditProductForm";
import AddSectionForm from "../components/AddSectionForm";
import { Eye, EyeOff } from "lucide-react";
import DoctorOverview from "./doctor-zone/pages/DoctorOverview";
import AllDoctors from "./doctor-zone/pages/Doctors";
import ApprovedDoctors from "./doctor-zone/pages/ApprovedDoctors";
import BlockedDoctors from "./doctor-zone/pages/BlockedDoctors";
import PendingDoctors from "./doctor-zone/pages/PendingDoctors";
import DoctorConsultations from "./doctor-zone/pages/Consultations";
import DoctorWallet from "./doctor-zone/pages/Wallet";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import PharmaOverview from "./pages/pharma/PharmaOverview";
import PendingPharma from "./pages/pharma/PendingPharma";
import ApprovedPharma from "./pages/pharma/ApprovedPharma";
import AllPharma from "./pages/pharma/AllPharma";
import PharmaProducts from "./pages/pharma/PharmaProducts";
import PharmaDocuments from "./pages/pharma/PharmaDocuments";
import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";
import DashboardCustomizeOutlined from "@mui/icons-material/DashboardCustomizeOutlined";
import AdminB2BSections from "./pages/AdminB2BSections";
import AdminBrandLogo from "./pages/AdminBrandLogo";
import AdminBioburgJewelers from "./pages/AdminBioburgJewelers";
import CMSPages from "./pages/CMSPages";
import CMSPageEditor from "./pages/CMSPageEditor";
import RegistrationTable from "../adminpanel/pages/registrations/RegistrationTable";
import JobHistory from "../marketingAgent/pages/JobHistory";
import Leads from "../marketingAgent/pages/Leads";
import Profile from "../marketingAgent/pages/Profile";
import AgentProfile from "../DeliveryAgent/pages/AgentProfile";
import DeliveryLeads from "../DeliveryAgent/pages/Leads";
import Training from "./MarketingAgent/Training&Meeting";
import AdminMarketingOrders from "./MarketingAgent/MarketingOrders"
import AdminPopupVideoManager from "../adminpanel/pages/AdminPopupVideoManager";
// diagnostics admin imports
import AdminLabs from "./diagnostics/AdminLabs";
import AdminRadiologyCenters from "./diagnostics/AdminRadiologyCenters";
import AdminBookings from "./diagnostics/AdminBookings";
import AdminReports from "./diagnostics/AdminReports";

// pathology imports
import PathologyOverview from "./pathology/PathologyOverview";
import PendingPathologyLabs from "./pathology/PendingPathologyLabs";
import ApprovedPathologyLabs from "./pathology/ApprovedPathologyLabs";
import AllPathologyLabs from "./pathology/AllPathologyLabs";

// franchiese imports
import FranchiseRequests from "../adminpanel/franchise/FranchiseRequests";
import AdminFranchiseOrders from "../adminpanel/franchise/AdminFranchiseOrders";
import AdminFranchiseAccounts from "../adminpanel/franchise/AdminFranchiseAccounts";
import AdminOrderTracking from "../adminpanel/franchise/AdminOrderTracking";
import FranchiseSalesReports from "../adminpanel/franchise/FranchiseSalesReports";
import AdminFranchiseRestockRequests from "../adminpanel/franchise/AdminFranchiseRestockRequests";
import AdminSupportTickets from "../adminpanel/franchise/AdminSupportTickets";
import AdminSupportTicketDetails from "../adminpanel/franchise/AdminSupportTicketDetails";
import AdminFranchiseZones from "../adminpanel/franchise/AdminFranchiseZones";
import AdminBulkManufacturingOverview from "./bulkManufacture/AdminBulkManufacturingOverview";
import AdminBulkManufacturingOrders from "./bulkManufacture/AdminBulkManufacturingOrders";
import AdminBulkManufacturingRequests from "./bulkManufacture/AdminBulkManufacturingRequests";
import AdminBulkManufacturingRequirements from "./bulkManufacture/AdminBulkManufacturingRequirements";
import AdminBulkManufacturingDocuments from "./bulkManufacture/AdminBulkManufacturingDocuments";

// Vendor Admin Imports
import VendorOverview from "../adminpanel/Adminvendor/AdminDashboard";
import ApprovedVendors from "../adminpanel/Adminvendor/vendors/ApprovedVendors";
import PendingVendors from "../adminpanel/Adminvendor/vendors/PendingVendors";
import VendorDetails from "../adminpanel/Adminvendor/vendors/VendorDetails";
import AllOrders from "../adminpanel/Adminvendor/orders/AllOrders";
import AssignedOrders from "../adminpanel/Adminvendor/orders/AssignedOrders";
import UnassignedOrders from "../adminpanel/Adminvendor/orders/UnassignedOrders";
import AllVendorProducts from "../adminpanel/Adminvendor/products/VendorAllProduct";
import VendorProducts from "../adminpanel/Adminvendor/products/VendorProducts";
import VendorAnalytics from "../adminpanel/Adminvendor/analytics/VendorAnalytics";
import VendorPayments from "../adminpanel/Adminvendor/payments/VendorPayments";

// Delivery
import DeliveryOverview from "./pages/delivery/DeliveryOverview";
import DeliveryAgents from "./pages/delivery/DeliveryAgents";
import DeliveryOrders from "./pages/delivery/DeliveryOrders";
import DeliveryAnalytics from "./pages/delivery/DeliveryAnalytics";
import DeliveryEarnings from "./pages/delivery/DeliveryEarnings";

// Hospital
import AdminHospitalApproval from "../adminpanel/hospitalpharmacy/AdminHospitalApproval";
import HospitalOverview from "../adminpanel/hospitalpharmacy/Hospitaloverview";
import HospitalAllHospitals from "../adminpanel/hospitalpharmacy/Hospitalallhospitals";
import HospitalActive from "../adminpanel/hospitalpharmacy/Hospitalactive";
import HospitalPending from "../adminpanel/hospitalpharmacy/Hospitalpending";
import HospitalRejected from "../adminpanel/hospitalpharmacy/Hospitalrejected";

// Pharmacy
import AdminPharmacyApproval from "../adminpanel/hospitalpharmacy/AdminPharmacyApproval";
import Pharmacyoverview from "../adminpanel/hospitalpharmacy/Pharmacyoverview";
import PharmacyAllPharmacies from "../adminpanel/hospitalpharmacy/PharmacyAllPharmacies";
import PharmacyActive from "../adminpanel/hospitalpharmacy/PharmacyActive";
import Pharmacypending from "../adminpanel/hospitalpharmacy/Pharmacypending";
import Pharmacyrejected from "../adminpanel/hospitalpharmacy/Pharmacyrejected";

// Jobs and Carrers
import JobsCareersAdmin from "../adminpanel/jobsandcarrers/allApplications";
import ManageJobs from "./jobsandcarrers/ManageJobs";
import JobsTracking from "./jobsandcarrers/Jobstracking";
import ManageExServiceJobs from "./jobsandcarrers/Manageexservicejobs";
import ExServiceApplicationsAdmin from "./jobsandcarrers/Exserviceapplicationsadmin";
import ExServiceTracking from "./jobsandcarrers/Exservicetracking";
import ExServiceReports from "./jobsandcarrers/Exservicereports";
import ExServiceSupportTickets from "./jobsandcarrers/Exservicesupporttickets";
import JobsReports from "./jobsandcarrers/Jobsreports";
import JobsSupportTickets from "./jobsandcarrers/Jobssupporttickets";

// D2C orders
import D2COrders from "./pages/D2Corders";
import D2CAllUsers from "./pages/D2CALLUsers";

const BASE_API = API_BASE_URL;

const subMenuBtnSx = {
  justifyContent: "flex-start",
  textTransform: "none",
  padding: "6px 8px",
  color: "#1976d2",
  fontSize: "0.85rem",
  width: "100%",
  fontWeight: 400,
};

const subMenuHeadingSx = {
  ml: 1,
  fontSize: 11,
  color: "#94a3b8",
  letterSpacing: 1,
  textTransform: "uppercase",
  mt: 1,
  mb: 0.5,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  //AUTH CHECK ON REFRESH
  useEffect(() => {
    const verifyAdminSession = async () => {
      if (!token) {
        toast.error("Please login again!");
        navigate("/admin-login", { replace: true });
        return;
      }

      try {
        await axios.get(`${BASE_API}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        localStorage.removeItem("adminToken");
        toast.error(
          error?.response?.data?.message || "Session expired. Please login again!"
        );
        navigate("/admin-login", { replace: true });
      }
    };

    verifyAdminSession();
  }, [navigate, token]);

  // DASHBOARD STATE
  const [openD2CZone, setOpenD2CZone] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [openCategory, setOpenCategory] = useState(false);
  const [openProducts, setOpenProducts] = useState(false);
  const [summary, setSummary] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [target, setTarget] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [sections, setSections] = useState([]);
  const [openSections, setOpenSections] = useState(false);
  const [openDoctorZone, setOpenDoctorZone] = useState(false);
  const [openPharmaZone, setOpenPharmaZone] = useState(false);
  const [openB2B, setOpenB2B] = useState(false);
  const [openBrandLogo, setOpenBrandLogo] = useState(false);
  const [openBioburgJewelers, setOpenBioburgJewelers] = useState(false);
  const [openMarketingZone, setOpenMarketingZone] = useState(false);
  const [openDeliveryZone, setOpenDeliveryZone] = useState(false);
  const [openRegistrations, setOpenRegistrations] = useState(false);
  const [openRadiology, setOpenRadiology] = useState(false);
  const [openPathologyZone, setOpenPathologyZone] = useState(false);
  const [openFranchiseZone, setOpenFranchiseZone] = useState(false);
  const [openVendorZone, setOpenVendorZone] = useState(false);
  const [openBulkManufacturerZone, setOpenBulkManufacturerZone] =
    useState(false);
  const [openBioburgJewelersZone, setOpenBioburgJewelersZone] = useState(false);
  const [openBioburgCAndFZone, setOpenBioburgCAndFZone] = useState(false);
  const [openHospitalZone, setOpenHospitalZone] = useState(false);
  const [openSponsorPharmaBrandZone, setOpenSponsorPharmaBrandZone] =
    useState(false);
  const [openInsurancePartnerZone, setOpenInsurancePartnerZone] =
    useState(false);
  const [openAboardIndiaCAndFZone, setOpenAboardIndiaCAndFZone] =
    useState(false);
  const [openJobsAndCareersZone, setOpenJobsAndCareersZone] = useState(false);
  const [openJobsExServiceZone, setOpenJobsExServiceZone] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [openPharmaApprovalZone, setOpenPharmaApprovalZone] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // DATE FILTER DEFAULTS
  const endDefault = new Date();
  const startDefault = new Date(
    endDefault.getFullYear(),
    endDefault.getMonth() - 11,
    1,
  );
  const fmtMonth = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const [startMonth, setStartMonth] = useState(fmtMonth(startDefault));
  const [endMonth, setEndMonth] = useState(fmtMonth(endDefault));

  // FETCH SUMMARY
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${BASE_API}/api/admin/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setSummary(res.data.data);
    } catch (err) {
      console.error("fetchSummary error:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // FETCH SALES
  const fetchMonthlySales = async (s = startMonth, e = endMonth) => {
    try {
      setLoadingSales(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${BASE_API}/api/admin/analytics/monthly-sales`,
        {
          params: { start: s, end: e },
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data.success) {
        setMonthlySales(
          res.data.data.map((d) => ({
            name: d.month,
            sales: d.sales,
            key: d.key,
          })),
        );
      }
    } catch (err) {
      console.error("fetchMonthlySales error:", err);
    } finally {
      setLoadingSales(false);
    }
  };

  // FETCH TARGET
  const fetchTarget = async (month = endMonth) => {
    try {
      setLoadingTarget(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${BASE_API}/api/admin/analytics/target`, {
        params: { month },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setTarget(res.data.data);
    } catch (err) {
      console.error("fetchTarget error:", err);
    } finally {
      setLoadingTarget(false);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    fetchSummary();
    fetchMonthlySales();
    fetchTarget();
  }, []);

  const fetchSections = () => {
    axios
      .get(`${BASE_API}/api/sections/all`)
      .then((res) => setSections(res.data.sections))
      .catch((err) => console.log("Sections Load Error:", err));
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const applyDateFilter = () => {
    fetchMonthlySales(startMonth, endMonth);
    fetchTarget(endMonth);
  };

  // CSV EXPORT
  const exportToCSV = (rows, filename = "export.csv") => {
    if (!rows || rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const csv = [
      keys.join(","),
      ...rows.map((r) =>
        keys
          .map((k) => `"${(r[k] ?? "").toString().replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSalesCSV = () => {
    const rows = monthlySales.map((m) => ({
      month: m.name,
      sales: m.sales,
    }));
    exportToCSV(rows, `monthly-sales_${startMonth}_to_${endMonth}.csv`);
  };

  const handleDownloadKPIsCSV = () => {
    const rows = [
      { metric: "totalUsers", value: summary?.totalUsers ?? "" },
      { metric: "totalOrders", value: summary?.totalOrders ?? "" },
      { metric: "revenue", value: summary?.revenue ?? "" },
    ];
    exportToCSV(rows, "kpis.csv");
  };

  // SIDEBAR ITEMS
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    {
      id: "products",
      label: "Products",
      icon: <InventoryIcon />,
      submenu: true,
    },
    {
      id: "category",
      label: "Category",
      icon: <CategoryIcon />,
      submenu: true,
    },
    { id: "nav-manager", label: "Navigation Manager", icon: <MenuIcon /> },
    { id: "banners", label: "Ad banners", icon: <PhotoLibraryIcon /> },
    { id: "home-slider", label: "Home slider", icon: <PhotoLibraryIcon /> },
    { id: "testimonials", label: "Testimonials", icon: <TestimonialIcon /> },
    {
      id: "user-question",
      label: "User question",
      icon: <QuestionAnswerIcon />,
    },
  ];

  // SIDEBAR CONTENT
  const SidebarContent = (
    <Box
      className="bg-white shadow-xl border-r flex flex-col"
      sx={{
        width: { xs: "75vw", md: 260 },
        height: "100vh",
        overflowY: "auto",
        borderColor: "#e5e7eb",
        position: { md: "fixed", xs: "fixed" },
        top: 0,
        left: 0,
        zIndex: 20,
      }}
    >
      <Box className="flex flex-col items-center py-6 mb-2 border-b">
        <Avatar
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          sx={{ width: 70, height: 70 }}
        />
        <Typography className="mt-2 font-bold text-gray-800 text-lg">
          Admin panel
        </Typography>
      </Box>

      <Box className="flex flex-col px-4 gap-1">
        {menuItems.map((item) => (
          <React.Fragment key={item.id}>
            {!item.submenu ? (
              <Button
                startIcon={item.icon}
                fullWidth
                onClick={() => setActiveSection(item.id)}
                sx={{
                  justifyContent: "flex-start",
                  borderRadius: 2,
                  textTransform: "none",
                  padding: "10px 14px",
                  backgroundColor:
                    activeSection === item.id
                      ? "rgba(0,0,0,0.06)"
                      : "transparent",
                  color: "#1e293b",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.08)",
                  },
                }}
              >
                {item.label}
              </Button>
            ) : (
              <>
                <Button
                  startIcon={item.icon}
                  fullWidth
                  endIcon={
                    item.id === "category" ? (
                      openCategory ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )
                    ) : item.id === "products" ? (
                      openProducts ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )
                    ) : null
                  }
                  onClick={() => {
                    if (item.id === "category") {
                      setOpenCategory(!openCategory);
                      setOpenProducts(false);
                    } else if (item.id === "products") {
                      setOpenProducts(!openProducts);
                      setOpenCategory(false);
                    }
                  }}
                  sx={{
                    justifyContent: "flex-start",
                    borderRadius: 2,
                    textTransform: "none",
                    padding: "10px 14px",
                    color: "#1e293b",
                    backgroundColor:
                      (item.id === "category" && openCategory) ||
                      (item.id === "products" && openProducts)
                        ? "rgba(0,0,0,0.06)"
                        : "transparent",
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.08)",
                    },
                  }}
                >
                  {item.label}
                </Button>

                <Collapse
                  in={
                    item.id === "category"
                      ? openCategory
                      : item.id === "products"
                        ? openProducts
                        : false
                  }
                  timeout="auto"
                  unmountOnExit
                >
                  <Box className="flex flex-col ml-8 py-2">
                    {item.id === "category" && (
                      <>
                        <Button
                          onClick={() => setActiveSection("add-category")}
                          sx={subMenuBtnSx}
                        >
                          Add category
                        </Button>
                        <Button
                          onClick={() => setActiveSection("all-category")}
                          sx={subMenuBtnSx}
                        >
                          All categories
                        </Button>
                      </>
                    )}

                    {item.id === "products" && (
                      <>
                        <Button
                          onClick={() => setActiveSection("add-product")}
                          sx={subMenuBtnSx}
                        >
                          Add product
                        </Button>
                        <Button
                          onClick={() => setActiveSection("admin-all-products")}
                          sx={subMenuBtnSx}
                        >
                          All products
                        </Button>
                      </>
                    )}
                  </Box>
                </Collapse>
              </>
            )}
          </React.Fragment>
        ))}

        <Divider className="my-3" />

        {/* CMS Pages */}
        <Button
          startIcon={<ArticleIcon />}
          fullWidth
          onClick={() => {
            setActiveSection("cms-pages");
            setOpenCategory(false);
            setOpenProducts(false);
            setOpenDoctorZone(false);
            setOpenPharmaZone(false);
            setOpenSections(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor:
              activeSection === "cms-pages"
                ? "rgba(0,0,0,0.06)"
                : "transparent",
            color: "#1e293b",
          }}
        >
          CMS pages
        </Button>

        {/* Policy Page  */}
        <Divider className="my-3" />
        <Button
          startIcon={<ArticleIcon />}
          fullWidth
          onClick={() => setActiveSection("policies-manager")}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openD2CZone ? "rgba(0,0,0,0.06)" : "transparent",
            color: "#1e293b",
          }}
        >
          Policies Manager
        </Button>
        
        {/* Popup video  */}
        <Divider className="my-3" />
        <Button
          startIcon={<ArticleIcon />}
          fullWidth
          onClick={() => setActiveSection("popupvideomanager")}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openD2CZone ? "rgba(0,0,0,0.06)" : "transparent",
            color: "#1e293b",
          }}
        >
          Popup Videos Manager
        </Button>

        {/* D2C Zone  */}
        <Divider className="my-3" />

        <Button
          startIcon={<CartIcon />}
          fullWidth
          endIcon={openD2CZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenD2CZone(!openD2CZone);
            setOpenCategory(false);
            setOpenProducts(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openD2CZone ? "rgba(0,0,0,0.06)" : "transparent",
            color: "#1e293b",
          }}
        >
          D2C Orders zone
        </Button>

        <Collapse in={openD2CZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("d2c-all-orders")}
              sx={subMenuBtnSx}
            >
              All orders
            </Button>
            <Button
              onClick={() => setActiveSection("d2c-pending-orders")}
              sx={subMenuBtnSx}
            >
              Pending orders
            </Button>
            <Button
              onClick={() => setActiveSection("d2c-delivered-orders")}
              sx={subMenuBtnSx}
            >
              Delivered orders
            </Button>
            <Button
              onClick={() => setActiveSection("d2c-all-users")}
              sx={subMenuBtnSx}
            >
              All users
            </Button>
          </Box>
        </Collapse>

        {/* ================= B2B SECTION ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<DashboardCustomizeOutlined />}
          fullWidth
          endIcon={openB2B ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenB2B(!openB2B);
            setOpenCategory(false);
            setOpenProducts(false);
            setOpenDoctorZone(false);
            setOpenPharmaZone(false);
            setOpenSections(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openB2B ? "rgba(0,0,0,0.06)" : "transparent",
            color: "#1e293b",
          }}
        >
          B2B section zone
        </Button>

        <Collapse in={openB2B} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("create-b2b")}
              sx={subMenuBtnSx}
            >
              ➕ Create B2B
            </Button>
          </Box>
        </Collapse>

        {/* ================= Brand Logo Section ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<DashboardCustomizeOutlined />}
          fullWidth
          endIcon={openBrandLogo ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenBrandLogo(!openBrandLogo);
            setOpenB2B(false);
            setOpenCategory(false);
            setOpenProducts(false);
            setOpenDoctorZone(false);
            setOpenPharmaZone(false);
            setOpenSections(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openBrandLogo ? "rgba(0,0,0,0.06)" : "transparent",
            color: "#1e293b",
          }}
        >
          Brand logo section zone
        </Button>

        <Collapse in={openBrandLogo} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("create-brandLogo")}
              sx={subMenuBtnSx}
            >
              ➕ Add brand logo
            </Button>
          </Box>
        </Collapse>

        {/* ================= Bioburg Jewelers Section ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<DashboardCustomizeOutlined />}
          fullWidth
          endIcon={openBioburgJewelers ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenBioburgJewelers(!openBioburgJewelers);
            setOpenBrandLogo(false);
            setOpenB2B(false);
            setOpenCategory(false);
            setOpenProducts(false);
            setOpenDoctorZone(false);
            setOpenPharmaZone(false);
            setOpenSections(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openBioburgJewelers
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Bioburg jewelers section
        </Button>

        <Collapse in={openBioburgJewelers} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("create-bioburg-jewelers")}
              sx={subMenuBtnSx}
            >
              ➕ Add Bioburg jewelers
            </Button>
            <Button
              onClick={() => setActiveSection("all-bioburg-jewelers")}
              sx={subMenuBtnSx}
            >
              📋 All Bioburg jewelers
            </Button>
          </Box>
        </Collapse>

        {/* ================= Marketing Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<StorefrontIcon />}
          fullWidth
          endIcon={openMarketingZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenMarketingZone(!openMarketingZone);
            setOpenDoctorZone(false);
            setOpenPharmaZone(false);
            setOpenCategory(false);
            setOpenProducts(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openMarketingZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Marketing zone
        </Button>

        <Collapse in={openMarketingZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("marketing-overview")}
              sx={subMenuBtnSx}
            >
              Profile
            </Button>
            <Button
              onClick={() => setActiveSection("marketing-vendors")}
              sx={subMenuBtnSx}
            >
              Job history
            </Button>
            <Button
              onClick={() => setActiveSection("marketing-products")}
              sx={subMenuBtnSx}
            >
              Leads
            </Button>
            <Button
              onClick={() => setActiveSection("training-meeting")}
              sx={subMenuBtnSx}
            >
              Training & Meeting
            </Button>
            <Button
              onClick={() => setActiveSection("marketing-orders")}
              sx={subMenuBtnSx}
            >
              Order Management
            </Button>
          </Box>
        </Collapse>

        {/* ================= Delivery Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<StorefrontIcon />}
          fullWidth
          endIcon={openDeliveryZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenDeliveryZone(!openDeliveryZone);
            setOpenMarketingZone(false);
            setOpenDoctorZone(false);
            setOpenPharmaZone(false);
            setOpenCategory(false);
            setOpenProducts(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openDeliveryZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Delivery zone
        </Button>

        <Collapse in={openDeliveryZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("delivery-overview")}
              sx={subMenuBtnSx}
            >
              Overview
            </Button>
            <Button
              onClick={() => setActiveSection("delivery-agents")}
              sx={subMenuBtnSx}
            >
              Agent management
            </Button>
            <Button
              onClick={() => setActiveSection("delivery-orders")}
              sx={subMenuBtnSx}
            >
              Order management
            </Button>
            <Button
              onClick={() => setActiveSection("delivery-analytics")}
              sx={subMenuBtnSx}
            >
              Analytics
            </Button>
            <Button
              onClick={() => setActiveSection("delivery-earnings")}
              sx={subMenuBtnSx}
            >
              Earnings
            </Button>
          </Box>
        </Collapse>

        {/* ================= DOCTOR ZONE ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<MedicalServicesOutlinedIcon />}
          fullWidth
          endIcon={openDoctorZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenDoctorZone(!openDoctorZone);
            setOpenCategory(false);
            setOpenProducts(false);
            setOpenSections(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openDoctorZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Doctor zone
        </Button>

        <Collapse in={openDoctorZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("doctor-overview")}
              sx={subMenuBtnSx}
            >
              Overview
            </Button>
            <Button
              onClick={() => setActiveSection("doctor-all")}
              sx={subMenuBtnSx}
            >
              All doctors
            </Button>
            <Button
              onClick={() => setActiveSection("doctor-approved")}
              sx={subMenuBtnSx}
            >
              Approved doctors
            </Button>
            <Button
              onClick={() => setActiveSection("doctor-pending")}
              sx={subMenuBtnSx}
            >
              Pending Doctor
            </Button>
            <Button
              onClick={() => setActiveSection("doctor-blocked")}
              sx={subMenuBtnSx}
            >
              Blocked doctors
            </Button>
            <Button
              onClick={() => setActiveSection("doctor-consultations")}
              sx={subMenuBtnSx}
            >
              Consultations
            </Button>
            <Button
              onClick={() => setActiveSection("doctor-wallet")}
              sx={subMenuBtnSx}
            >
              Wallet
            </Button>
          </Box>
        </Collapse>

        {/* ================= Franchise Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<StorefrontIcon />}
          fullWidth
          endIcon={openFranchiseZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenFranchiseZone(!openFranchiseZone);
            setOpenDoctorZone(false);
            setOpenDeliveryZone(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openFranchiseZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Franchise zone
        </Button>

        <Collapse in={openFranchiseZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("admin-franchise-requests")}
              sx={subMenuBtnSx}
            >
              Franchise requests
            </Button>
            <Button
              onClick={() => setActiveSection("franchise-accounts")}
              sx={subMenuBtnSx}
            >
              Franchise accounts
            </Button>

            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>Orders</Typography>

            <Button
              onClick={() => setActiveSection("admin-franchise-orders")}
              sx={subMenuBtnSx}
            >
              Franchise orders
            </Button>
            <Button
              onClick={() => setActiveSection("franchise-assign-zone")}
              sx={subMenuBtnSx}
            >
              Zone mapping
            </Button>
            <Button
              onClick={() => setActiveSection("order-tracking")}
              sx={subMenuBtnSx}
            >
              Order tracking
            </Button>

            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>Sales & support</Typography>

            <Button
              onClick={() => setActiveSection("sales-reports")}
              sx={subMenuBtnSx}
            >
              Sales & settlements
            </Button>
            <Button
              onClick={() => setActiveSection("franchise-restock")}
              sx={subMenuBtnSx}
            >
              Inventory & restock
            </Button>
            <Button
              onClick={() => setActiveSection("admin-support")}
              sx={subMenuBtnSx}
            >
              Support tickets
            </Button>
          </Box>
        </Collapse>

        {/* ================= Vendor Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<MedicalServicesOutlinedIcon />}
          fullWidth
          endIcon={openVendorZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenVendorZone(!openVendorZone);
            setOpenPathologyZone(false);
            setOpenDoctorZone(false);
            setOpenPharmaZone(false);
            setOpenRegistrations(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openVendorZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Vendor zone
        </Button>

        <Collapse in={openVendorZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("vendor-overview")}
              sx={subMenuBtnSx}
            >
              Overview
            </Button>
            <Button
              onClick={() => setActiveSection("approve-vendor")}
              sx={subMenuBtnSx}
            >
              Approve vendor
            </Button>
            <Button
              onClick={() => setActiveSection("pending-vendor")}
              sx={subMenuBtnSx}
            >
              Pending vendor
            </Button>
            <Button
              onClick={() => setActiveSection("vendor-details")}
              sx={subMenuBtnSx}
            >
              Vendor details
            </Button>
            <Button
              onClick={() => setActiveSection("all-orders")}
              sx={subMenuBtnSx}
            >
              All orders
            </Button>
            <Button
              onClick={() => setActiveSection("assigned-orders")}
              sx={subMenuBtnSx}
            >
              Assigned orders
            </Button>
            <Button
              onClick={() => setActiveSection("unassigned-orders")}
              sx={subMenuBtnSx}
            >
              Unassigned orders
            </Button>
            <Button
              onClick={() => setActiveSection("vendor-all-products")}
              sx={subMenuBtnSx}
            >
              All products
            </Button>
            <Button
              onClick={() => setActiveSection("vendor-products")}
              sx={subMenuBtnSx}
            >
              Vendor products
            </Button>
            <Button
              onClick={() => setActiveSection("vendor-analytics")}
              sx={subMenuBtnSx}
            >
              Vendor analytics
            </Button>
            <Button
              onClick={() => setActiveSection("vendor-payments")}
              sx={subMenuBtnSx}
            >
              Vendor payments
            </Button>
          </Box>
        </Collapse>

        {/* ================= Pathology Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<MedicalServicesOutlinedIcon />}
          fullWidth
          endIcon={openPathologyZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenPathologyZone(!openPathologyZone);
            setOpenDoctorZone(false);
            setOpenPharmaZone(false);
            setOpenRegistrations(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openPathologyZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Pathology zone
        </Button>

        <Collapse in={openPathologyZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("pathology-overview")}
              sx={subMenuBtnSx}
            >
              Overview
            </Button>
            <Button
              onClick={() => setActiveSection("pathology-all")}
              sx={subMenuBtnSx}
            >
              All labs
            </Button>
            <Button
              onClick={() => setActiveSection("pathology-pending")}
              sx={subMenuBtnSx}
            >
              Pending labs
            </Button>
            <Button
              onClick={() => setActiveSection("pathology-approved")}
              sx={subMenuBtnSx}
            >
              Approved labs
            </Button>
            <Button
              onClick={() => setActiveSection("sales-reports")}
              sx={subMenuBtnSx}
            >
              Sales & reports
            </Button>
            <Button
              onClick={() => setActiveSection("admin-support")}
              sx={subMenuBtnSx}
            >
              Support tickets
            </Button>
          </Box>
        </Collapse>

        {/* ================= Bioburg Jewelers Zone ================= */}
        <Collapse in={openBioburgJewelersZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("bioburg-jewelers-requests")}
              sx={subMenuBtnSx}
            >
              Bioburg jewelers requests
            </Button>
            <Button
              onClick={() => setActiveSection("bioburg-jewelers-accounts")}
              sx={subMenuBtnSx}
            >
              Bioburg jewelers accounts
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>Orders</Typography>
            <Button
              onClick={() => setActiveSection("bioburg-jewelers-orders")}
              sx={subMenuBtnSx}
            >
              All orders
            </Button>
            <Button
              onClick={() => setActiveSection("bioburg-jewelers-assign-zone")}
              sx={subMenuBtnSx}
            >
              Assign zone
            </Button>
            <Button
              onClick={() =>
                setActiveSection("bioburg-jewelers-order-tracking")
              }
              sx={subMenuBtnSx}
            >
              Order tracking
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>Sales & support</Typography>
            <Button
              onClick={() => setActiveSection("bioburg-jewelers-sales")}
              sx={subMenuBtnSx}
            >
              Sales & reports
            </Button>
            <Button
              onClick={() => setActiveSection("bioburg-jewelers-support")}
              sx={subMenuBtnSx}
            >
              Support tickets
            </Button>
          </Box>
        </Collapse>

        {/* ================= Bioburg C & F Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<StorefrontIcon />}
          fullWidth
          endIcon={openBioburgCAndFZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenBioburgCAndFZone(!openBioburgCAndFZone);
            setOpenBioburgJewelersZone(false);
            setOpenFranchiseZone(false);
            setOpenDoctorZone(false);
            setOpenDeliveryZone(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openBioburgCAndFZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Bioburg C & F zone
        </Button>

        <Collapse in={openBioburgCAndFZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("bioburg-c-and-f-requests")}
              sx={subMenuBtnSx}
            >
              Bioburg C & F requests
            </Button>
            <Button
              onClick={() => setActiveSection("bioburg-c-and-f-accounts")}
              sx={subMenuBtnSx}
            >
              Bioburg C & F accounts
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>Orders</Typography>
            <Button
              onClick={() => setActiveSection("bioburg-c-and-f-orders")}
              sx={subMenuBtnSx}
            >
              All orders
            </Button>
            <Button
              onClick={() => setActiveSection("bioburg-c-and-f-assign-zone")}
              sx={subMenuBtnSx}
            >
              Assign zone
            </Button>
            <Button
              onClick={() => setActiveSection("bioburg-c-and-f-order-tracking")}
              sx={subMenuBtnSx}
            >
              Order tracking
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>Sales & support</Typography>
            <Button
              onClick={() => setActiveSection("bioburg-c-and-f-sales")}
              sx={subMenuBtnSx}
            >
              Sales & reports
            </Button>
            <Button
              onClick={() => setActiveSection("bioburg-c-and-f-support")}
              sx={subMenuBtnSx}
            >
              Support tickets
            </Button>
          </Box>
        </Collapse>

        {/* ================= Hospital Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<MedicalServicesOutlinedIcon />}
          fullWidth
          endIcon={openHospitalZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenHospitalZone(!openHospitalZone);
            setOpenBioburgCAndFZone(false);
            setOpenBioburgJewelersZone(false);
            setOpenFranchiseZone(false);
            setOpenDoctorZone(false);
            setOpenDeliveryZone(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openHospitalZone
              ? "rgba(0,119,163,0.1)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Hospital zone
        </Button>

        <Collapse in={openHospitalZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("hospital-overview")}
              sx={subMenuBtnSx}
            >
              Overview
            </Button>
            <Button
              onClick={() => setActiveSection("hospital-all")}
              sx={subMenuBtnSx}
            >
              All hospitals
            </Button>
            <Button
              onClick={() => setActiveSection("hospital-active")}
              sx={subMenuBtnSx}
            >
              Active hospitals
            </Button>
            <Button
              onClick={() => setActiveSection("hospital-pending")}
              sx={subMenuBtnSx}
            >
              Pending approvals
            </Button>
            <Button
              onClick={() => setActiveSection("hospital-rejected")}
              sx={subMenuBtnSx}
            >
              Rejected
            </Button>
          </Box>
        </Collapse>

        {/* ================= Pharmacy Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<AddBusinessOutlinedIcon />}
          fullWidth
          endIcon={openPharmaApprovalZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenPharmaApprovalZone(!openPharmaApprovalZone);
            setOpenHospitalZone(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openPharmaApprovalZone
              ? "rgba(22,163,74,0.1)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Pharmacy zone
        </Button>

        <Collapse in={openPharmaApprovalZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("pharmacy-overview")}
              sx={subMenuBtnSx}
            >
              Overview
            </Button>
            <Button
              onClick={() => setActiveSection("pharmacy-all")}
              sx={subMenuBtnSx}
            >
              All pharmacies
            </Button>
            <Button
              onClick={() => setActiveSection("pharmacy-active")}
              sx={subMenuBtnSx}
            >
              Active pharmacies
            </Button>
            <Button
              onClick={() => setActiveSection("pharmacy-pending")}
              sx={subMenuBtnSx}
            >
              Pending approvals
            </Button>
            <Button
              onClick={() => setActiveSection("pharmacy-rejected")}
              sx={subMenuBtnSx}
            >
              Rejected
            </Button>
          </Box>
        </Collapse>

        {/* ================= Sponsor Pharma Brand Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<StorefrontIcon />}
          fullWidth
          endIcon={openSponsorPharmaBrandZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenSponsorPharmaBrandZone(!openSponsorPharmaBrandZone);
            setOpenHospitalZone(false);
            setOpenBioburgCAndFZone(false);
            setOpenBioburgJewelersZone(false);
            setOpenFranchiseZone(false);
            setOpenDoctorZone(false);
            setOpenDeliveryZone(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openSponsorPharmaBrandZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Sponsor pharma brand zone
        </Button>

        <Collapse in={openSponsorPharmaBrandZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("hospital-and-pharmacy-requests")}
              sx={subMenuBtnSx}
            >
              Sponsor & pharma
            </Button>
            <Button
              onClick={() => setActiveSection("bioburg-c-and-f-order-tracking")}
              sx={subMenuBtnSx}
            >
              Sponsor tracking
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>Sales & support</Typography>
            <Button
              onClick={() => setActiveSection("bioburg-c-and-f-sales")}
              sx={subMenuBtnSx}
            >
              Sales & reports
            </Button>
            <Button
              onClick={() => setActiveSection("bioburg-c-and-f-support")}
              sx={subMenuBtnSx}
            >
              Support tickets
            </Button>
          </Box>
        </Collapse>

        {/* ================= Insurance Partner Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<StorefrontIcon />}
          fullWidth
          endIcon={openInsurancePartnerZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenInsurancePartnerZone(!openInsurancePartnerZone);
            setOpenSponsorPharmaBrandZone(false);
            setOpenHospitalZone(false);
            setOpenBioburgCAndFZone(false);
            setOpenBioburgJewelersZone(false);
            setOpenFranchiseZone(false);
            setOpenDoctorZone(false);
            setOpenDeliveryZone(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openInsurancePartnerZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Insurance partner zone
        </Button>

        <Collapse in={openInsurancePartnerZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("insurance-partner-requests")}
              sx={subMenuBtnSx}
            >
              Insurance partner
            </Button>
            <Button
              onClick={() =>
                setActiveSection("insurance-partner-order-tracking")
              }
              sx={subMenuBtnSx}
            >
              Insurance partner tracking
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>
              Insurance partner support
            </Typography>
            <Button
              onClick={() => setActiveSection("insurance-partner-sales")}
              sx={subMenuBtnSx}
            >
              Sales & reports
            </Button>
            <Button
              onClick={() => setActiveSection("insurance-partner-support")}
              sx={subMenuBtnSx}
            >
              Support tickets
            </Button>
          </Box>
        </Collapse>

        {/* ================= Aboard India C & F Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<StorefrontIcon />}
          fullWidth
          endIcon={openAboardIndiaCAndFZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenAboardIndiaCAndFZone(!openAboardIndiaCAndFZone);
            setOpenInsurancePartnerZone(false);
            setOpenSponsorPharmaBrandZone(false);
            setOpenHospitalZone(false);
            setOpenBioburgCAndFZone(false);
            setOpenBioburgJewelersZone(false);
            setOpenFranchiseZone(false);
            setOpenDoctorZone(false);
            setOpenDeliveryZone(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openAboardIndiaCAndFZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Aboard India C & F zone
        </Button>

        <Collapse in={openAboardIndiaCAndFZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("aboard-india-c-and-f-requests")}
              sx={subMenuBtnSx}
            >
              Aboard India C & F
            </Button>
            <Button
              onClick={() =>
                setActiveSection("aboard-india-c-and-f-order-tracking")
              }
              sx={subMenuBtnSx}
            >
              Aboard India C & F tracking
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>
              Aboard India C & F support
            </Typography>
            <Button
              onClick={() => setActiveSection("aboard-india-c-and-f-sales")}
              sx={subMenuBtnSx}
            >
              Sales & reports
            </Button>
            <Button
              onClick={() => setActiveSection("aboard-india-c-and-f-support")}
              sx={subMenuBtnSx}
            >
              Support tickets
            </Button>
          </Box>
        </Collapse>

        {/* ================= Jobs & Careers Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<StorefrontIcon />}
          fullWidth
          endIcon={openJobsAndCareersZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenJobsAndCareersZone(!openJobsAndCareersZone);
            setOpenAboardIndiaCAndFZone(false);
            setOpenInsurancePartnerZone(false);
            setOpenSponsorPharmaBrandZone(false);
            setOpenHospitalZone(false);
            setOpenBioburgCAndFZone(false);
            setOpenBioburgJewelersZone(false);
            setOpenFranchiseZone(false);
            setOpenDoctorZone(false);
            setOpenDeliveryZone(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openJobsAndCareersZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Jobs & careers zone
        </Button>

        <Collapse in={openJobsAndCareersZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("jobs-and-careers-requests")}
              sx={subMenuBtnSx}
            >
              Jobs & careers
            </Button>
            <Button
              onClick={() => setActiveSection("jobs-careers-applications")}
              sx={subMenuBtnSx}
            >
              All applications
            </Button>
            <Button
              onClick={() =>
                setActiveSection("jobs-and-careers-order-tracking")
              }
              sx={subMenuBtnSx}
            >
              Jobs & careers tracking
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>
              Jobs & careers support
            </Typography>
            <Button
              onClick={() => setActiveSection("jobs-and-careers-reports")}
              sx={subMenuBtnSx}
            >
              Reports
            </Button>
            <Button
              onClick={() => setActiveSection("jobs-and-careers-support")}
              sx={subMenuBtnSx}
            >
              Support tickets
            </Button>
          </Box>
        </Collapse>

        {/* ================= Jobs & ExService Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<StorefrontIcon />}
          fullWidth
          endIcon={openJobsExServiceZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenJobsExServiceZone(!openJobsExServiceZone);
            setOpenJobsAndCareersZone(false);
            setOpenAboardIndiaCAndFZone(false);
            setOpenInsurancePartnerZone(false);
            setOpenSponsorPharmaBrandZone(false);
            setOpenHospitalZone(false);
            setOpenBioburgCAndFZone(false);
            setOpenBioburgJewelersZone(false);
            setOpenFranchiseZone(false);
            setOpenDoctorZone(false);
            setOpenDeliveryZone(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openJobsExServiceZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Jobs & ExService zone
        </Button>

        <Collapse in={openJobsExServiceZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("jobs-and-exservice-requests")}
              sx={subMenuBtnSx}
            >
              Jobs & ExService
            </Button>
            <Button
              onClick={() =>
                setActiveSection("jobs-and-exservice-applications")
              }
              sx={subMenuBtnSx}
            >
              All applications
            </Button>
            <Button
              onClick={() =>
                setActiveSection("jobs-and-exservice-order-tracking")
              }
              sx={{ ...subMenuBtnSx, whiteSpace: "nowrap" }}
            >
              Jobs & ExService tracking
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography sx={subMenuHeadingSx}>
              Jobs & ExService support
            </Typography>
            <Button
              onClick={() => setActiveSection("jobs-and-exservice-reports")}
              sx={subMenuBtnSx}
            >
              Reports
            </Button>
            <Button
              onClick={() => setActiveSection("jobs-and-exservice-support")}
              sx={subMenuBtnSx}
            >
              Support tickets
            </Button>
          </Box>
        </Collapse>

        {/* ================= Bulk Manufacturer Zone ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<AddBusinessOutlinedIcon />}
          fullWidth
          endIcon={openBulkManufacturerZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenBulkManufacturerZone(!openBulkManufacturerZone);
            setOpenPharmaZone(false);
            setOpenDoctorZone(false);
            setOpenSections(false);
            setOpenCategory(false);
            setOpenProducts(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openBulkManufacturerZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Bulk-manufacturer zone
        </Button>

        <Collapse in={openBulkManufacturerZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("bulk-manufacturer-overview")}
              sx={subMenuBtnSx}
            >
              Overview
            </Button>
            <Button
              onClick={() => setActiveSection("bulk-manufacturer-pending")}
              sx={subMenuBtnSx}
            >
              Pending manufacturers
            </Button>
            <Button
              onClick={() => setActiveSection("bulk-manufacturer-approved")}
              sx={subMenuBtnSx}
            >
              Approved manufacturers
            </Button>
            <Button
              onClick={() => setActiveSection("bulk-manufacturer-all")}
              sx={subMenuBtnSx}
            >
              All manufacturers
            </Button>
            <Button
              onClick={() => setActiveSection("bulk-manufacturer-orders")}
              sx={subMenuBtnSx}
            >
              Website orders
            </Button>
            <Button
              onClick={() => setActiveSection("bulk-manufacturer-products")}
              sx={subMenuBtnSx}
            >
              Medicines / products
            </Button>
            <Button
              onClick={() => setActiveSection("bulk-manufacturer-documents")}
              sx={subMenuBtnSx}
            >
              Documents verification
            </Button>
          </Box>
        </Collapse>

        {/* ================= PHARMA MANUFACTURER ZONE ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<AddBusinessOutlinedIcon />}
          fullWidth
          endIcon={openPharmaZone ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenPharmaZone(!openPharmaZone);
            setOpenDoctorZone(false);
            setOpenSections(false);
            setOpenCategory(false);
            setOpenProducts(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openPharmaZone
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Pharma-manufacturer zone
        </Button>

        <Collapse in={openPharmaZone} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("pharma-overview")}
              sx={subMenuBtnSx}
            >
              Overview
            </Button>
            <Button
              onClick={() => setActiveSection("pharma-pending")}
              sx={subMenuBtnSx}
            >
              Pending manufacturers
            </Button>
            <Button
              onClick={() => setActiveSection("pharma-approved")}
              sx={subMenuBtnSx}
            >
              Approved manufacturers
            </Button>
            <Button
              onClick={() => setActiveSection("pharma-all")}
              sx={subMenuBtnSx}
            >
              All manufacturers
            </Button>
            <Button
              onClick={() => setActiveSection("pharma-products")}
              sx={subMenuBtnSx}
            >
              Website products
            </Button>
            <Button
              onClick={() => setActiveSection("pharma-documents")}
              sx={subMenuBtnSx}
            >
              Document verification
            </Button>
          </Box>
        </Collapse>

        {/* ================= REGISTRATIONS SECTION ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<PeopleIcon />}
          fullWidth
          endIcon={openRegistrations ? <ExpandLess /> : <ExpandMore />}
          onClick={() => {
            setOpenRegistrations(!openRegistrations);
            setOpenDoctorZone(false);
            setOpenPharmaZone(false);
            setOpenSections(false);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openRegistrations
              ? "rgba(0,0,0,0.06)"
              : "transparent",
            color: "#1e293b",
          }}
        >
          Registrations
        </Button>

        <Collapse in={openRegistrations} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("reg-d2c")}
              sx={subMenuBtnSx}
            >
              (D2C) users
            </Button>
            <Button
              onClick={() => setActiveSection("reg-pharma")}
              sx={subMenuBtnSx}
            >
              Pharma manufacturers
            </Button>
            <Button
              onClick={() => setActiveSection("reg-doctors")}
              sx={subMenuBtnSx}
            >
              Online doctors
            </Button>
            <Button
              onClick={() => setActiveSection("reg-pathology")}
              sx={subMenuBtnSx}
            >
              Pathology labs
            </Button>
            <Button
              onClick={() => setActiveSection("reg-radiology")}
              sx={subMenuBtnSx}
            >
              Radiology centres
            </Button>
            <Button
              onClick={() => setActiveSection("reg-vendors")}
              sx={subMenuBtnSx}
            >
              Bioburg vendors
            </Button>
            <Button
              onClick={() => setActiveSection("reg-franchise")}
              sx={subMenuBtnSx}
            >
              Bioburg franchise
            </Button>
            <Button
              onClick={() => setActiveSection("reg-jobs")}
              sx={subMenuBtnSx}
            >
              Jobs & careers
            </Button>
            <Button
              onClick={() => setActiveSection("reg-exservicemen")}
              sx={subMenuBtnSx}
            >
              Jobs – ex-servicemen
            </Button>
          </Box>
        </Collapse>

        {/* ================= RADIOLOGY ZONE ================= */}
        <Divider className="my-3" />

        <Button
          startIcon={<MedicalServicesOutlinedIcon />}
          fullWidth
          endIcon={openRadiology ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setOpenRadiology(!openRadiology)}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openRadiology ? "rgba(0,0,0,0.06)" : "transparent",
            color: "#1e293b",
          }}
        >
          Radiology zone
        </Button>

        <Collapse in={openRadiology} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("admin-labs")}
              sx={subMenuBtnSx}
            >
              Radiology labs
            </Button>
            <Button
              onClick={() => setActiveSection("radiology-centers")}
              sx={subMenuBtnSx}
            >
              Radiology centers
            </Button>
            <Button
              onClick={() => setActiveSection("radiology-bookings")}
              sx={subMenuBtnSx}
            >
              Radiology bookings
            </Button>
            <Button
              onClick={() => setActiveSection("radiology-reports")}
              sx={subMenuBtnSx}
            >
              Radiology reports
            </Button>
          </Box>
        </Collapse>

        {/*HOME SECTIONS ZONE*/}
        <Divider className="my-3" />

        <Button
          startIcon={<LocalOfferIcon />}
          fullWidth
          endIcon={openSections ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setOpenSections(!openSections)}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            padding: "10px 14px",
            backgroundColor: openSections ? "rgba(0,0,0,0.06)" : "transparent",
            color: "#1e293b",
          }}
        >
          Home sections zone
        </Button>

        <Collapse in={openSections} timeout="auto" unmountOnExit>
          <Box className="flex flex-col ml-8 py-2">
            <Button
              onClick={() => setActiveSection("add-section")}
              sx={subMenuBtnSx}
            >
              ➕ Create new section
            </Button>

            {/* {sections.map((sec) => (
              <Box key={sec.key} className="mb-2">
                <Button
                  onClick={() => setActiveSection(`add-${sec.key}`)}
                  sx={subMenuBtnSx}
                >
                  {sec.title}
                </Button>
                <Button
                  onClick={() => setActiveSection(`all-${sec.key}`)}
                  sx={subMenuBtnSx}
                >
                  <Eye size={16} strokeWidth={2} style={{ marginRight: 4 }} />
                  {sec.title}
                </Button> */}
            {/* </Box>
            ))} */}
          </Box>
        </Collapse>
      </Box>

      <Divider className="my-4" />

      {/* LOGOUT */}
      <Box className="px-4 pb-6 mt-5">
        <Button
          fullWidth
          startIcon={<LogoutIcon />}
          sx={{
            backgroundColor: "#ef4444",
            color: "white",
            textTransform: "none",
            borderRadius: 2,
            "&:hover": { backgroundColor: "#dc2626" },
          }}
          onClick={() => {
            localStorage.removeItem("adminToken");
            toast.success("Logged out!");
            navigate("/admin-login");
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box className="flex bg-[#fff] min-h-screen">
      {/* Mobile Drawer */}
      <Drawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        {SidebarContent}
      </Drawer>

      {/* Desktop Sidebar */}
      <Box className="hidden md:block">{SidebarContent}</Box>

      {/* MAIN CONTENT */}
      <Box
        className="flex-1 p-5 md:p-8"
        sx={{
          ml: { md: "260px", xs: 0 },
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* HEADER */}
        <Box className="flex items-center justify-between mb-6">
          <Box className="flex items-center gap-3">
            <IconButton
              onClick={() => setOpenDrawer(true)}
              className="md:hidden"
            >
              <MenuIcon />
            </IconButton>
            <Typography className="text-2xl font-bold text-gray-800">
              Dashboard
            </Typography>
          </Box>
          <Box className="flex items-center gap-3">
            <Paper elevation={1} className="px-4 py-2 rounded-lg">
              <Typography variant="body2" className="text-gray-700">
                Welcome back
              </Typography>
            </Paper>
            <Avatar src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" />
          </Box>
        </Box>

        {/*DASHBOARD SECTION*/}
        {activeSection === "dashboard" && (
          <>
            {/* KPIs */}
            <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Paper className="p-5 rounded-2xl" elevation={3}>
                <Typography className="text-sm text-gray-500">
                  Customers
                </Typography>
                {loadingSummary ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography className="text-2xl font-bold mt-2">
                    {summary?.totalUsers?.toLocaleString() ?? "-"}
                  </Typography>
                )}
              </Paper>

              <Paper className="p-5 rounded-2xl" elevation={3}>
                <Typography className="text-sm text-gray-500">
                  Orders
                </Typography>
                {loadingSummary ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography className="text-2xl font-bold mt-2">
                    {summary?.totalOrders?.toLocaleString() ?? "-"}
                  </Typography>
                )}
              </Paper>

              <Paper className="p-5 rounded-2xl" elevation={3}>
                <Typography className="text-sm text-gray-500">
                  Revenue
                </Typography>
                {loadingSummary ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography className="text-2xl font-bold mt-2">
                    ₹{summary?.revenue ?? "-"}
                  </Typography>
                )}
              </Paper>
            </Box>

            {/* DATE FILTER + EXPORT */}
            <Box className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
              <Box className="flex items-center gap-2">
                <label>
                  From:&nbsp;
                  <input
                    type="month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                  />
                </label>
                <label>
                  To:&nbsp;
                  <input
                    type="month"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                  />
                </label>
                <Button
                  variant="contained"
                  onClick={applyDateFilter}
                  sx={{ textTransform: "none" }}
                >
                  Apply
                </Button>
              </Box>
              <Box className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  onClick={handleDownloadKPIsCSV}
                  sx={{ textTransform: "none" }}
                >
                  Export KPIs CSV
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleDownloadSalesCSV}
                  sx={{ textTransform: "none" }}
                >
                  Export sales CSV
                </Button>
              </Box>
            </Box>

            {/* CHARTS */}
            <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Sales */}
              <Paper
                className="p-4 rounded-2xl"
                elevation={3}
                style={{ minHeight: 320 }}
              >
                <Box className="flex items-center justify-between mb-2">
                  <Typography className="font-semibold text-gray-800">
                    Monthly sales
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    {startMonth} — {endMonth}
                  </Typography>
                </Box>
                {loadingSales ? (
                  <Box
                    className="flex items-center justify-center"
                    style={{ height: 240 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={monthlySales}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="sales"
                        fill="#4f46e5"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>

              {/* Target Progress */}
              <Paper
                className="p-4 rounded-2xl flex flex-col items-center justify-center"
                elevation={3}
                style={{ minHeight: 320 }}
              >
                <Typography className="font-semibold text-gray-800 mb-2">
                  Monthly target
                </Typography>
                {loadingTarget ? (
                  <CircularProgress />
                ) : (
                  <>
                    <Box style={{ width: 220, height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="70%"
                          outerRadius="100%"
                          barSize={18}
                          data={[
                            {
                              name: "target",
                              value: target?.percent ?? 0,
                              fill: "#4f46e5",
                            },
                          ]}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <RadialBar
                            minAngle={15}
                            background
                            clockWise
                            dataKey="value"
                            cornerRadius={10}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </Box>
                    <Typography className="text-3xl font-bold mt-2">
                      {target?.percent ?? 0}%
                    </Typography>
                    <Typography className="text-sm text-gray-500 mt-1">
                      Target achievement
                    </Typography>
                  </>
                )}
              </Paper>
            </Box>
          </>
        )}

        {/*OTHER SECTIONS*/}

        {/* CATEGORY */}
        {activeSection === "add-category" && <CardForm />}
        {activeSection === "all-category" && <AllCategories />}

        {/* Nav Manager  */}
        {activeSection === "nav-manager" && <AdminNavManager />}

        {/* Policy Manager  */}
        {activeSection === "policies-manager" && <PoliciesManager />}

        {/* STATIC PRODUCT SYSTEM */}
        {activeSection === "add-product" && <AddProductForm />}
        {activeSection === "all-products" && <AllProducts />}

        {/* LAUNCH / BRAND / TREND / ARTICLES */}
        {activeSection === "banners" && <BannerForm />}
        {activeSection === "home-slider" && <AdminHomeSlider />}
        {activeSection === "health-articles" && <HealthArticleForm />}
        {activeSection === "popupvideomanager" && <AdminPopupVideoManager />}

        {activeSection === "testimonials" && (
          <Paper className="p-6 rounded-xl bg-white shadow-md">
            <CreateTestimonial />
          </Paper>
        )}

        {/* ================= D2C ORDERS ZONE ================= */}
        {activeSection === "d2c-all-orders" && <D2COrders />}
        {activeSection === "d2c-pending-orders" && (
          <D2COrders statusFilter="pending" />
        )}
        {activeSection === "d2c-delivered-orders" && (
          <D2COrders statusFilter="delivered" />
        )}
        {activeSection === "d2c-all-users" && <D2CAllUsers />}

        {/* ================= Marketing ZONE ================= */}
        {activeSection === "marketing-overview" && <Profile />}
        {activeSection === "marketing-vendors" && <JobHistory />}
        {activeSection === "marketing-products" && <DeliveryLeads />}
        {activeSection === "training-meeting" && <Training/>}
        {activeSection === "marketing-orders" && <AdminMarketingOrders/>}

        {/* ================= Delivery ZONE ================= */}
        {activeSection === "delivery-overview" && <DeliveryOverview />}
        {activeSection === "delivery-agents" && <DeliveryAgents />}
        {activeSection === "delivery-orders" && <DeliveryOrders />}
        {activeSection === "delivery-analytics" && <DeliveryAnalytics />}
        {activeSection === "delivery-earnings" && <DeliveryEarnings />}

        {/* ======================= DOCTOR ZONE ======================= */}
        {activeSection === "doctor-overview" && <DoctorOverview />}
        {activeSection === "doctor-all" && <AllDoctors />}
        {activeSection === "doctor-approved" && <ApprovedDoctors />}
        {activeSection === "doctor-blocked" && <BlockedDoctors />}
        {activeSection === "doctor-pending" && <PendingDoctors />}
        {activeSection === "doctor-consultations" && <DoctorConsultations />}
        {activeSection === "doctor-wallet" && <DoctorWallet />}

        {/* ================= PHARMA MANUFACTURER ZONE ================= */}
        {activeSection === "pharma-overview" && <PharmaOverview />}
        {activeSection === "pharma-pending" && <PendingPharma />}
        {activeSection === "pharma-approved" && <ApprovedPharma />}
        {activeSection === "pharma-all" && <AllPharma />}
        {activeSection === "pharma-products" && <PharmaProducts />}

        {/* ================= BULK MANUFACTURING ZONE ================= */}
        {activeSection === "bulk-manufacturer-overview" && (
          <AdminBulkManufacturingOverview />
        )}
        {activeSection === "bulk-manufacturer-pending" && (
          <AdminBulkManufacturingRequests mode="pending" />
        )}
        {activeSection === "bulk-manufacturer-approved" && (
          <AdminBulkManufacturingRequests mode="approved" />
        )}
        {activeSection === "bulk-manufacturer-all" && (
          <AdminBulkManufacturingRequests mode="all" />
        )}
        {activeSection === "bulk-manufacturer-orders" && (
          <AdminBulkManufacturingOrders />
        )}
        {activeSection === "bulk-manufacturer-products" && (
          <AdminBulkManufacturingRequirements />
        )}
        {activeSection === "bulk-manufacturer-documents" && (
          <AdminBulkManufacturingDocuments />
        )}

        {/* ================= REGISTRATIONS ================= */}
        {activeSection === "reg-d2c" && (
          <RegistrationTable title="D2C users" type="d2c-user" />
        )}
        {activeSection === "reg-pharma" && (
          <RegistrationTable
            title="Pharma manufacturers"
            type="pharma-manufacturer"
          />
        )}
        {activeSection === "reg-doctors" && (
          <RegistrationTable title="Online doctors" type="online-doctor" />
        )}
        {activeSection === "reg-pathology" && (
          <RegistrationTable title="Pathology labs" type="pathology-lab" />
        )}
        {activeSection === "reg-radiology" && (
          <RegistrationTable
            title="Radiology centres"
            type="radiology-center"
          />
        )}
        {activeSection === "reg-vendors" && (
          <RegistrationTable title="Bioburg vendors" type="vendor" />
        )}
        {activeSection === "reg-franchise" && (
          <RegistrationTable title="Bioburg franchise" type="franchise" />
        )}
        {activeSection === "reg-jobs" && (
          <RegistrationTable title="Jobs & careers" type="job" />
        )}
        {activeSection === "reg-exservicemen" && (
          <RegistrationTable title="Ex-servicemen jobs" type="ex-servicemen" />
        )}

        {/* ================= Franchise ZONE ================= */}
        {activeSection === "admin-franchise-requests" && <FranchiseRequests />}
        {activeSection === "admin-franchise-orders" && (
          <AdminFranchiseOrders
            onTrackOrder={(id) => {
              setSelectedOrderId(id);
              setActiveSection("order-tracking");
            }}
          />
        )}
        {activeSection === "franchise-assign-zone" && (
          <AdminFranchiseZones
            onOpenRequests={() => setActiveSection("admin-franchise-requests")}
          />
        )}
        {activeSection === "franchise-accounts" && <AdminFranchiseAccounts />}
        {activeSection === "order-tracking" && (
          <AdminOrderTracking orderId={selectedOrderId} />
        )}
        {activeSection === "sales-reports" && <FranchiseSalesReports />}
        {activeSection === "franchise-restock" && <AdminFranchiseRestockRequests />}
        {activeSection === "admin-support" && (
          <AdminSupportTickets
            onOpenTicket={(id) => setActiveSection(`admin-support-${id}`)}
          />
        )}
        {activeSection.startsWith("admin-support-") && (
          <AdminSupportTicketDetails
            ticketId={activeSection.replace("admin-support-", "")}
            onBack={() => setActiveSection("admin-support")}
          />
        )}

        {/* ================= Hospital & Pharmacy ZONE ================= */}
        {activeSection === "admin-hospital-approval" && (
          <AdminHospitalApproval />
        )}
        {activeSection === "hospital-overview" && <HospitalOverview />}
        {activeSection === "hospital-all" && <HospitalAllHospitals />}
        {activeSection === "hospital-active" && <HospitalActive />}
        {activeSection === "hospital-pending" && <HospitalPending />}
        {activeSection === "hospital-rejected" && <HospitalRejected />}
        {activeSection === "admin-pharmacy-approval" && (
          <AdminPharmacyApproval />
        )}
        {activeSection === "pharmacy-overview" && <Pharmacyoverview />}
        {activeSection === "pharmacy-all" && <PharmacyAllPharmacies />}
        {activeSection === "pharmacy-active" && <PharmacyActive />}
        {activeSection === "pharmacy-pending" && <Pharmacypending />}
        {activeSection === "pharmacy-rejected" && <Pharmacyrejected />}

        {/* ================= RADIOLOGY ZONE ================= */}
        {activeSection === "admin-labs" && <AdminLabs />}
        {activeSection === "radiology-centers" && <AdminRadiologyCenters />}
        {activeSection === "radiology-bookings" && <AdminBookings />}
        {activeSection === "radiology-reports" && <AdminReports />}

        {/* ================= PATHOLOGY ZONE ================= */}
        {activeSection === "pathology-overview" && <PathologyOverview />}
        {activeSection === "pathology-pending" && <PendingPathologyLabs />}
        {activeSection === "pathology-approved" && <ApprovedPathologyLabs />}
        {activeSection === "pathology-all" && <AllPathologyLabs />}

        {/* ================= Vendor ZONE ================= */}
        {activeSection === "vendor-overview" && <VendorOverview />}
        {activeSection === "approve-vendor" && (
          <ApprovedVendors
            onView={(id) => {
              setSelectedVendorId(id);
              setActiveSection("vendor-details");
            }}
          />
        )}

        {activeSection === "pending-vendor" && (
          <PendingVendors
            onView={(id) => {
              setSelectedVendorId(id);
              setActiveSection("vendor-details");
            }}
          />
        )}
        {activeSection === "vendor-details" && <VendorDetails />}
        {activeSection === "all-orders" && <AllOrders />}
        {activeSection === "assigned-orders" && <AssignedOrders />}
        {activeSection === "unassigned-orders" && <UnassignedOrders />}
        {activeSection === "vendor-all-products" && <AllVendorProducts />}
        {activeSection === "vendor-products" && <VendorProducts />}
        {activeSection === "vendor-analytics" && <VendorAnalytics />}
        {activeSection === "vendor-payments" && <VendorPayments />}

        {/* Jobs and Careers */}
        {activeSection === "jobs-and-careers-requests" && <ManageJobs />}
        {activeSection === "jobs-careers-applications" && <JobsCareersAdmin />}
        {activeSection === "jobs-and-careers-order-tracking" && (
          <JobsTracking />
        )}
        {activeSection === "jobs-and-exservice-requests" && (
          <ManageExServiceJobs />
        )}
        {activeSection === "jobs-and-exservice-applications" && (
          <ExServiceApplicationsAdmin />
        )}
        {activeSection === "jobs-and-exservice-order-tracking" && (
          <ExServiceTracking />
        )}
        {activeSection === "jobs-and-exservice-reports" && <ExServiceReports />}
        {activeSection === "jobs-and-exservice-support" && (
          <ExServiceSupportTickets />
        )}
        {activeSection === "jobs-and-careers-reports" && <JobsReports />}
        {activeSection === "jobs-and-careers-support" && <JobsSupportTickets />}

        {/* ================= CMS SYSTEM ================= */}
        {activeSection === "cms-pages" && (
          <CMSPages setActiveSection={setActiveSection} />
        )}
        {activeSection === "cms-edit-home" && <CMSPageEditor page="home" />}
        {activeSection === "cms-edit-about" && <CMSPageEditor page="about" />}

        {/* ================= B2B SECTION ================= */}
        {activeSection === "create-b2b" && <AdminB2BSections />}

        {/* ================= Product Brand Logo SECTION ================= */}
        {activeSection === "create-brandLogo" && <AdminBrandLogo />}

        {/* ================= Bioburg Jewelers SECTION ================= */}
        {activeSection === "create-bioburg-jewelers" && (
          <AdminBioburgJewelers />
        )}

        {/* ================= Admin All Products ================= */}
        {activeSection === "admin-all-products" && (
          <AdminAllProduct
            onEdit={(id) => {
              setSelectedProductId(id);
              setActiveSection("edit-product");
            }}
          />
        )}
        {activeSection === "edit-product" && selectedProductId && (
          <EditProductForm
            productId={selectedProductId}
            onBack={() => {
              setSelectedProductId(null);
              setActiveSection("admin-all-products");
            }}
          />
        )}

        {/*  ADD NEW HOME SECTION  */}
        {activeSection === "add-section" && (
          <AddSectionForm onSectionCreated={fetchSections} />
        )}

        {/*  DYNAMICALLY GENERATED SECTIONS */}
        {sections.map((sec) => (
          <React.Fragment key={sec.key}>
            {activeSection === `add-${sec.key}` && (
              <AddProductForm sectionKey={sec.key} />
            )}
            {activeSection === `all-${sec.key}` && (
              <AdminAllProduct sectionKey={sec.key} />
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default Dashboard;
