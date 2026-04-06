
import React from "react";

export default function Header({ title, onToggle }) {
  return (
    <div className="bg-white shadow px-6 py-4 flex items-center gap-4">
      <button onClick={onToggle} className="text-blue-600 text-xl">
        ☰
      </button>
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  );
}
