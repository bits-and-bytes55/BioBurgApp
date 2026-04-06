import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function ManufacturerLayout() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex">
      <Sidebar isOpen={open} />

      <div className={`flex-1 ${open ? "ml-64" : "ml-0"} transition-all`}>
        <Header
          title="Manufacturer Panel"
          onToggle={() => setOpen(!open)}
        />

        <div className="p-6 bg-gray-50 min-h-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
