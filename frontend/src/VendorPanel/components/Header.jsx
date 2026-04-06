import React from "react";
import { Menu, Notifications, Search } from "@mui/icons-material";
import { useVendor } from "../context/VendorContext";

export default function Header({ title, onToggle }) {
  const { vendor } = useVendor();
  const avatar = vendor?.ownerPhoto;

  return (
    <div className="sticky top-0 z-30 bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onToggle} className="p-2 bg-gray-100 rounded-md">
          <Menu />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <input className="pl-9 pr-4 py-1.5 bg-gray-100 border rounded-lg text-sm w-56" />
          <Search className="absolute left-2 top-2 text-gray-400" fontSize="small" />
        </div>

        <button className="relative p-2 hover:bg-gray-100 rounded-full">
          <Notifications fontSize="small" />
        </button>

        <img
          src={avatar && avatar !== "null" && avatar !== "undefined" ? avatar : "/default-avatar.png"}
          alt="Owner"
          className="w-9 h-9 rounded-full object-cover"
          onError={(e) => (e.target.src = "/default-avatar.png")}
        />
      </div>
    </div>
  );
}