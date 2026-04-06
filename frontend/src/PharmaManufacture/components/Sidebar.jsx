import React from "react";
import { Link, useLocation } from "react-router-dom";
import { clearManufacturerSession } from "../manufacturerApi";

export default function Sidebar({ isOpen }) {
  const loc = useLocation();

  const menu = [
    { label: "Dashboard", path: "/manufacturer/dashboard" },
    { label: "Profile", path: "/manufacturer/profile" },
    { label: "Product Management", path: "/manufacturer/products" },
    { label: "Orders", path: "/manufacturer/orders" },
    { label: "Payments", path: "/manufacturer/payments" },
    { label: "Settings", path: "/manufacturer/settings" },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-[#0f172a] text-white 
      transition-transform duration-300 z-50
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* LOGO */}
      <div className="p-6 text-xl font-bold border-b border-slate-700">
        BIOBURG MFG
      </div>

      {/* MENU */}
      <div className="p-4 space-y-1">
        {menu.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className={`block px-4 py-3 rounded-lg text-sm transition
              ${
                loc.pathname === m.path
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-300 hover:bg-slate-800 hover:text-white"
              }`}
          >
            {m.label}
          </Link>
        ))}

        {/* LOGOUT */}
        <button
          onClick={() => {
            clearManufacturerSession();
            window.location.href = "/login/manufacturer";
          }}
          className="w-full text-left mt-4 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-800 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
