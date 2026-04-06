import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Dashboard,
  ShoppingBag,
  Inventory2,
  BarChart,
  AccountBalanceWallet,
  Person,
  Logout,
} from "@mui/icons-material";
import { useVendor } from "../context/VendorContext";

export default function VendorSidebar({ isOpen }) {
  const { vendor } = useVendor();
  const photo = vendor?.ownerPhoto;
  const name  = vendor?.fullName;
  const loc   = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login/vendor";
  };

  const menu = [
    { label: "Dashboard", icon: <Dashboard fontSize="small" />,           path: "/vendor/dashboard" },
    { label: "Orders",    icon: <ShoppingBag fontSize="small" />,         path: "/vendor/orders"    },
    { label: "Products",  icon: <Inventory2 fontSize="small" />,          path: "/vendor/products"  },
    { label: "Payments",  icon: <AccountBalanceWallet fontSize="small" />,path: "/vendor/payments"  },
    { label: "Analytics", icon: <BarChart fontSize="small" />,            path: "/vendor/analytics" },
    { label: "Profile",   icon: <Person fontSize="small" />,              path: "/vendor/profile"   },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-[#131921] text-white shadow-xl z-50 transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="p-6 text-xl font-bold border-b border-gray-700">
        <span className="text-blue-400">Seller</span> Dashboard
      </div>

      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <img
            src={photo && photo !== "null" && photo !== "undefined" ? photo : "/default-avatar.png"}
            alt="Vendor"
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => (e.target.src = "/default-avatar.png")}
          />
          <div>
            <h3 className="font-semibold text-sm">{name || "Vendor User"}</h3>
            <p className="text-gray-400 text-xs">Logged In Seller</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {menu.map((m, i) => (
          <Link
            key={i}
            to={m.path}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition ${
              loc.pathname === m.path
                ? "bg-blue-400 text-black font-bold"
                : "hover:bg-[#232f3e]"
            }`}
          >
            {m.icon}
            {m.label}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-400 hover:bg-[#232f3e] px-4 py-3 rounded-lg w-full"
        >
          <Logout fontSize="small" /> Logout
        </button>
      </div>
    </div>
  );
}