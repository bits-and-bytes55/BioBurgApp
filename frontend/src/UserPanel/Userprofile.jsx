import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PersonalInfo from "./PersonalInfo";
import AddressPage from "./AddressPage";
import WishlistPage from "./WishlistPage";
import CouponsPage from "./CouponsPage";
import PrescriptionsPage from "./PrescriptionsPage";
import ChangePassword from "./ChangePassword";
import OrdersPage from "./OrdersPage";
import BuyAgainPage from "./BuyAgainPage";
import ConsultationsPage from "./ConsultationsPage";
import PatientsPage from "./PatientsPage";
import CommunicationPreferences from "./CommunicationPreferences";
import QApage from "./QApage";

// --- Icons (Inline SVGs) ---
const UserIcon = () => (
  <svg
    className="w-12 h-12 text-[#6892D5]"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const EditIcon = () => (
  <svg
    className="w-4 h-4 text-[#6892D5]"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

const OrderIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

const CartIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const StethoscopeIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const PatientIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const LocationIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const PersonOutlineIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const EnvelopeIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

// --- ICONS FOR MY STUFF ---
const ChatIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const HeartIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const CouponIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M15 5v2a2 2 0 002 2 2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-2a2 2 0 00-2-2 2 2 0 00-2-2v2m-5-9h.01M10 14h.01M14 10h.01M10 10h.01M14 14h.01"
    />
  </svg>
);

const PrescriptionIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const MaleIcon = () => (
  <svg
    className="w-8 h-8 text-[#6892D5]"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const FemaleIcon = () => (
  <svg
    className="w-8 h-8 text-[#6892D5]"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

export default function UserProfile() {
  const [activePage, setActivePage] = useState("personal");
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    address: "",
    username: "",
    phone: "",
    city: "",
    state: "",
    facilityType: "",
    licenseNumber: "",
    type: "user",
  });
  const navigate = useNavigate();

  const BASE_API = 'https://bioburglifescience-1.onrender.com';
  // const BASE_API = import.meta.env.VITE_API_BASE_URL;
  console.log();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userType = storedUser.type;

    // console.log("TOKEN:", token);
    // console.log("USER TYPE:", userType);

    if (!token) {
      console.log("NO TOKEN FOUND");
      return;
    }

    //  Hospital/Pharmacy User
    if (userType === "hospital-pharmacy") {
      axios
        .get(`${BASE_API}/api/hospital-pharmacy/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("HOSPITAL PROFILE:", res.data);
          const h = res.data.facility;
          setUser({
            firstName: h.facilityName || "",
            lastName: "",
            gender: "",
            email: h.email || "",
            address: h.address || "",
            username: h.contactPerson || "",
            phone: h.phone || "",
            city: h.city || "",
            state: h.state || "",
            facilityType: h.facilityType || "",
            licenseNumber: h.licenseNumber || "",
            type: "hospital-pharmacy",
          });
        })
        .catch((err) => {
          console.log("HOSPITAL PROFILE ERROR:", err);
        });
    }
    // Regular User
    else {
      axios
        .get(`${BASE_API}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          // console.log("USER PROFILE RESPONSE:", res.data);
          const u = res.data.user;
          setUser({
            firstName: u.name || "",
            lastName: u.lastname || "",
            gender: u.gender || "",
            email: u.email || "",
            address: u.address || "",
            username: u.username || "",
            phone: "",
            city: "",
            state: "",
            facilityType: "",
            licenseNumber: "",
            type: "user",
          });
        })
        .catch((err) => {
          console.log("USER PROFILE ERROR:", err);
        });
    }
  }, []);

  // console.log(user);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const fullName = `${user.firstName} ${user.lastName}`.trim() || "User Name";

  return (
    <div className="min-h-screen bg-[#EFF3FF] p-4 md:p-8 font-sans">
      {/* Floating Back to Products Button */}
      <button
        onClick={() => navigate("/")}
        className="fixed bottom-6 right-6 bg-[#6892D5] text-white px-5 py-3 rounded-full shadow-xl 
             hover:bg-[#557CC0] transition-all duration-200 flex items-center gap-2 backdrop-blur-md
             border border-white/30"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Products
      </button>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* --- LEFT SIDEBAR --- */}
        <div className="w-full lg:w-1/4 flex flex-col gap-4">
          {/* 1. Profile Summary Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 relative">
            <div className="w-16 h-16 rounded-full border-2 border-[#6892D5] p-1 flex items-center justify-center">
              <UserIcon />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg capitalize">
                {fullName}
              </h3>
              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                {user.email}
              </p>
            </div>
            <button className="absolute top-4 right-4">
              <EditIcon />
            </button>
          </div>

          {/* 2. My Orders Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#FFF9E6] p-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-700 text-sm">My Orders</h4>
            </div>
            <div className="p-0">
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => setActivePage("orders")}
              >
                <OrderIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Orders</p>
                  <p className="text-xs text-gray-400">
                    View, Track, Change/Cancel, Return/Replace, Download Invoice
                  </p>
                </div>
              </div>
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setActivePage("buyagain")}
              >
                <CartIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    Buy Again
                  </p>
                  <p className="text-xs text-gray-400">
                    Buy any of your purchased products again
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. My Consultations Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#FFF9E6] p-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-700 text-sm">
                My Consultations
              </h4>
            </div>
            <div className="p-0">
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => setActivePage("consult")}
              >
                <StethoscopeIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    Consultations
                  </p>
                  <p className="text-xs text-gray-400">
                    View all your consultation queries and doctor's replies
                  </p>
                </div>
              </div>
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setActivePage("patients")}
              >
                <PatientIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    Patients
                  </p>
                  <p className="text-xs text-gray-400">
                    Create, view and edit all your patient details
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. My Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#FFF9E6] p-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-700 text-sm">My Profile</h4>
            </div>
            <div className="p-0">
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => setActivePage("address")}
              >
                <LocationIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    Addresses
                  </p>
                  <p className="text-xs text-gray-400">
                    Save, Delete & Change your delivery addresses
                  </p>
                </div>
              </div>
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => setActivePage("personal")}
              >
                <PersonOutlineIcon />
                <div>
                  <h2 className="font-bold text-gray-700">Personal Info</h2>

                  <p className="text-xs text-gray-400">
                    View or edit your personal info
                  </p>
                </div>
              </div>

              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setActivePage("password")}
              >
                <LockIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    Change Password
                  </p>
                  <p className="text-xs text-gray-400">
                    Change your old password
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. My Preferences Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#FFF9E6] p-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-700 text-sm">
                My Preferences
              </h4>
            </div>
            <div className="p-0">
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setActivePage("preferences")}
              >
                <EnvelopeIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    Communication Preferences
                  </p>
                  <p className="text-xs text-gray-400">
                    Set communication preference for Offers, Surveys, Q&A,
                    Ratings and Reviews
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 6. My Stuff Section (NEW ADDED) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#FFF9E6] p-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-700 text-sm">My Stuff</h4>
            </div>
            <div className="p-0">
              {/* Questions & Answers */}
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => setActivePage("qa")}
              >
                <ChatIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    My Questions & Answers
                  </p>
                  <p className="text-xs text-gray-400">
                    View all your questions and answers for any products
                  </p>
                </div>
              </div>

              {/* Wishlist */}
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => setActivePage("wishlist")}
              >
                <HeartIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    My Wishlist
                  </p>
                  <p className="text-xs text-gray-400">
                    View all products in your wishlist
                  </p>
                </div>
              </div>

              {/* Coupons */}
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => setActivePage("coupons")}
              >
                <CouponIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    My Coupons
                  </p>
                  <p className="text-xs text-gray-400">
                    View all of your available coupons
                  </p>
                </div>
              </div>

              {/* Prescriptions */}
              <div
                className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setActivePage("prescriptions")}
              >
                <PrescriptionIcon />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    My Prescriptions
                  </p>
                  <p className="text-xs text-gray-400">
                    View all of your prescriptions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-2 text-red-500 bg-white border border-red-200 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors"
          >
            Log Out
          </button>
        </div>

        {/* --- RIGHT MAIN CONTENT --- */}
        {/* --- RIGHT MAIN CONTENT --- */}
        <div className="w-full lg:w-3/4 flex flex-col gap-4">
          {/* Header */}
          <div className="bg-[#FFF9E6] p-4 rounded-lg border border-gray-200">
            <h2 className="font-bold text-gray-700">Personal Info</h2>
          </div>

          {/* FORM / PAGE CONTENT */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 h-full">
            {activePage === "personal" && (
              <>
                {user.type === "hospital-pharmacy" ? (
                  // ✅ HOSPITAL/PHARMACY FIELDS
                  <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                    <div className="relative border-b border-gray-300 py-2">
                      <label className="text-xs text-gray-400">
                        Facility Name
                      </label>
                      <input
                        type="text"
                        value={user.firstName}
                        readOnly
                        className="w-full text-gray-700"
                      />
                    </div>

                    <div className="relative border-b border-gray-300 py-2">
                      <label className="text-xs text-gray-400">
                        Facility Type
                      </label>
                      <input
                        type="text"
                        value={user.facilityType}
                        readOnly
                        className="w-full text-gray-700 capitalize"
                      />
                    </div>

                    <div className="relative border-b border-gray-300 py-2">
                      <label className="text-xs text-gray-400">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={user.licenseNumber}
                        readOnly
                        className="w-full text-gray-700"
                      />
                    </div>

                    <div className="relative border-b border-gray-300 py-2">
                      <label className="text-xs text-gray-400">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={user.username}
                        readOnly
                        className="w-full text-gray-700"
                      />
                    </div>

                    <div className="relative border-b border-gray-300 py-2">
                      <label className="text-xs text-gray-400">Email ID</label>
                      <input
                        type="text"
                        value={user.email}
                        readOnly
                        className="w-full text-gray-700"
                      />
                    </div>

                    <div className="relative border-b border-gray-300 py-2">
                      <label className="text-xs text-gray-400">Phone</label>
                      <input
                        type="text"
                        value={user.phone}
                        readOnly
                        className="w-full text-gray-700"
                      />
                    </div>

                    <div className="relative border-b border-gray-300 py-2">
                      <label className="text-xs text-gray-400">Address</label>
                      <input
                        type="text"
                        value={user.address}
                        readOnly
                        className="w-full text-gray-700"
                      />
                    </div>

                    <div className="relative border-b border-gray-300 py-2">
                      <label className="text-xs text-gray-400">City</label>
                      <input
                        type="text"
                        value={user.city}
                        readOnly
                        className="w-full text-gray-700"
                      />
                    </div>

                    <div className="relative border-b border-gray-300 py-2">
                      <label className="text-xs text-gray-400">State</label>
                      <input
                        type="text"
                        value={user.state}
                        readOnly
                        className="w-full text-gray-700"
                      />
                    </div>
                  </div>
                ) : (
                  // ✅ REGULAR USER FIELDS
                  <>
                    {/* Gender Selection */}
                    <div className="flex justify-center gap-12 mb-10">
                      {/* Male */}
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                            user.gender === "male"
                              ? "border-[#6892D5] bg-blue-50"
                              : "border-gray-300"
                          }`}
                        >
                          <MaleIcon />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Male
                        </span>
                      </div>

                      {/* Female */}
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                            user.gender === "female"
                              ? "border-[#6892D5] bg-pink-50"
                              : "border-gray-300"
                          }`}
                        >
                          <FemaleIcon />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Female
                        </span>
                      </div>

                      {/* Other */}
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                            user.gender === "other"
                              ? "border-[#6892D5] bg-purple-50"
                              : "border-gray-300"
                          }`}
                        >
                          <span className="text-lg font-bold text-[#6892D5]">
                            O
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Other
                        </span>
                      </div>
                    </div>

                    {/* Fields Mapping */}
                    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                      <div className="relative border-b border-gray-300 py-2">
                        <label className="text-xs text-gray-400">
                          Email ID
                        </label>
                        <input
                          type="text"
                          value={user.email}
                          readOnly
                          className="w-full text-gray-700"
                        />
                      </div>

                      <div className="relative border-b border-gray-300 py-2">
                        <label className="text-xs text-gray-400">Address</label>
                        <input
                          type="text"
                          value={user.address}
                          readOnly
                          className="w-full text-gray-700"
                        />
                      </div>

                      <div className="relative border-b border-gray-300 py-2">
                        <label className="text-xs text-gray-400">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={`${user.firstName} ${user.lastName}`}
                          readOnly
                          className="w-full text-gray-700"
                        />
                      </div>

                      <div className="relative border-b border-gray-300 py-2">
                        <label className="text-xs text-gray-400">
                          Username
                        </label>
                        <input
                          type="text"
                          value={user.username}
                          readOnly
                          className="w-full text-gray-700"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
            {activePage === "address" && <AddressPage />}
            {activePage === "wishlist" && <WishlistPage />}
            {activePage === "coupons" && <CouponsPage />}
            {activePage === "prescriptions" && <PrescriptionsPage />}
            {activePage === "password" && <ChangePassword />}
            {activePage === "orders" && <OrdersPage />}
            {activePage === "buyagain" && <BuyAgainPage />}
            {activePage === "consult" && <ConsultationsPage />}
            {activePage === "patients" && <PatientsPage />}
            {activePage === "preferences" && <CommunicationPreferences />}
            {activePage === "qa" && <QApage />}
          </div>
        </div>
      </div>
    </div>
  );
}
