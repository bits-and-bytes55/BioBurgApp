import React, { useState } from "react";
import VendorSidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet, useLocation } from "react-router-dom";

export default function VendorLayout() {
  const [isOpen, setIsOpen] = useState(true); // DEFAULT = sidebar visible
  const loc = useLocation();

  const pageTitle = loc.pathname.split("/")[2] || "Dashboard";

  return (
    <div className="flex">

      {/* Sidebar */}
<VendorSidebar isOpen={isOpen} />

      {/* Page Content */}
      <div className={`flex-1 transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>

        {/* Header with toggle button */}
        <Header
          title={`Vendor — ${pageTitle}`}
          onToggle={() => setIsOpen(!isOpen)}
        />

        <div className="p-6 bg-gray-50 min-h-screen">
          <Outlet />
        </div>

      </div>
    </div>
  );
}
