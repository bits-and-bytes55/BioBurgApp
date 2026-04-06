import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_API = import.meta.env.VITE_API_BASE_URL;


export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_API}/api/user/consultations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConsultations(res.data.consultations || []);
      } catch (err) {
        console.error("Consultations fetch error:", err);
        setError("Failed to load consultations.");
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  const filtered =
    activeTab === "ALL"
      ? consultations
      : consultations.filter((c) => c.type === activeTab);

  const tabs = [
    { key: "ALL", label: "All" },
    { key: "RADIOLOGY", label: "Radiology" },
    { key: "LAB", label: "Lab Tests" },
  ];

  const statusColor = (status) => {
    const map = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      REPORT_READY: "bg-teal-100 text-teal-800",
    };
    return map[(status || "").toUpperCase()] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <div className="w-5 h-5 border-2 border-[#6892D5] border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">Loading consultations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Consultations</h2>
      <p className="text-gray-500 text-sm mb-5">Your test history.</p>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2 px-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? "border-[#6892D5] text-[#6892D5]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 opacity-30"
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
          <p className="font-medium text-gray-500">No consultations found</p>
          <p className="text-xs mt-1">Your booking and report history will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((c, i) => (
  <ConsultationCard key={`${c.report?._id || c._id}-${i}`} consultation={c} statusColor={statusColor} />
))}
        </div>
      )}
    </div>
  );
}

function ConsultationCard({ consultation: c, statusColor }) {
  const [expanded, setExpanded] = useState(false);

  const isLab = c.type === "LAB";
  const patientName = c.fullName || c.patientName || "—";
  const tests = isLab
    ? (c.selectedTests || []).join(", ")
    : Array.isArray(c.scanTypes)
    ? c.scanTypes.join(", ")
    : c.scanTypes || c.testName || "—";
  const date = c.apptDate || c.bookingDate || c.createdAt;
  const reportUrl = isLab 
  ? c.report?.url 
  : c.report?.reportFile?.url || c.report?.url;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div
        className="flex items-center justify-between p-4 cursor-pointer bg-white hover:bg-gray-50"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              isLab ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            {isLab ? "LAB" : "RAD"}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{patientName}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tests || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(c.status)}`}
          >
            {c.status || "PENDING"}
          </span>
          <span className="text-xs text-gray-400 hidden sm:block">
            {date
              ? new Date(date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mb-4">
            <Detail label="Type" value={isLab ? "Lab Test" : "Radiology"} />
            <Detail
              label="Date"
              value={
                date
                  ? new Date(date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <Detail label="Slot" value={c.apptSlot || "—"} />
            <Detail label="Mobile" value={c.mobile || "—"} />
            <Detail label="Payment" value={c.paymentMode || "—"} />
            <Detail label="Collection" value={c.collectionType || c.serviceType || "—"} />
            {!isLab && <Detail label="Body Part" value={c.bodyPart || "—"} />}
            {!isLab && <Detail label="Contrast" value={c.contrast || "—"} />}
            {c.clinicalIndication && (
              <div className="col-span-2 sm:col-span-3">
                <Detail label="Clinical Indication" value={c.clinicalIndication} />
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            {reportUrl ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Report Available
                </span>
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 bg-[#6892D5] text-white rounded-lg hover:bg-[#557CC0] transition-colors font-medium"
                >
                  View Report
                </a>
                <a
                  href={reportUrl}
                  download
                  className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Download
                </a>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                Report not yet uploaded
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-700 font-medium">{value || "—"}</p>
    </div>
  );
}