import React, { useEffect, useState } from "react";
import {
  Briefcase,
  CheckCircle,
  CircleAlert,
  Clock3,
  CreditCard,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import manufacturerApi from "../manufacturerApi";

const formatStatus = (value) =>
  String(value || "PENDING")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusTone = (value) => {
  if (value === "APPROVED" || value === "VERIFIED" || value === "ACTIVE") {
    return {
      icon: <CheckCircle className="text-green-600" size={40} />,
      label: "text-green-700",
      helper: "Everything is in good standing.",
    };
  }

  if (value === "REJECTED" || value === "ISSUES_FOUND" || value === "BLOCKED") {
    return {
      icon: <XCircle className="text-red-500" size={40} />,
      label: "text-red-600",
      helper: "Admin attention is required before you can operate normally.",
    };
  }

  if (value === "UNDER_REVIEW") {
    return {
      icon: <Clock3 className="text-amber-500" size={40} />,
      label: "text-amber-600",
      helper: "The admin team is currently reviewing your submission.",
    };
  }

  return {
    icon: <CircleAlert className="text-slate-500" size={40} />,
    label: "text-slate-600",
    helper: "Some setup steps are still pending.",
  };
};

export default function ManufacturerDashboard() {
  const [stats, setStats] = useState({
    totalCapabilities: 0,
    uploadedDocuments: 0,
    qualityCertifications: 0,
    contractModes: 0,
    applicationStatus: "PENDING",
    documentReviewStatus: "PENDING",
    accountStatus: "PENDING_APPROVAL",
    bankingConfigured: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await manufacturerApi.get("/manufacturer/dashboard");

        if (isMounted) {
          setStats((current) => ({
            ...current,
            ...(res.data.summary || {}),
          }));
          setError("");
        }
      } catch (err) {
        console.error("Manufacturer dashboard error:", err);
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load manufacturer dashboard right now.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const reviewTone = getStatusTone(stats.documentReviewStatus);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Manufacturer Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Compliance, capabilities, and onboarding readiness at a glance.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Capabilities"
          value={stats.totalCapabilities}
          icon={<Briefcase />}
          color="blue"
        />
        <StatCard
          title="Documents Uploaded"
          value={stats.uploadedDocuments}
          icon={<FileText />}
          color="indigo"
        />
        <StatCard
          title="Quality Certs"
          value={stats.qualityCertifications}
          icon={<ShieldCheck />}
          color="green"
        />
        <StatCard
          title="Contract Modes"
          value={stats.contractModes}
          icon={<CreditCard />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow border p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            Document Verification Status
          </h3>

          <div className="flex items-center gap-4">
            {reviewTone.icon}
            <div>
              <p className={`text-lg font-semibold ${reviewTone.label}`}>
                {formatStatus(stats.documentReviewStatus)}
              </p>
              <p className="text-gray-500 text-sm">{reviewTone.helper}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            Account Summary
          </h3>

          <div className="space-y-4">
            <SummaryRow
              label="Application Status"
              value={formatStatus(stats.applicationStatus)}
              color={
                stats.applicationStatus === "APPROVED"
                  ? "green"
                  : stats.applicationStatus === "REJECTED"
                    ? "red"
                    : "orange"
              }
            />
            <SummaryRow
              label="Account Access"
              value={formatStatus(stats.accountStatus)}
              color={stats.accountStatus === "ACTIVE" ? "green" : "orange"}
            />
            <SummaryRow
              label="Banking Setup"
              value={stats.bankingConfigured ? "Configured" : "Pending"}
              color={stats.bankingConfigured ? "green" : "red"}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border p-6 mt-10">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Quick Actions
        </h3>

        <div className="flex flex-wrap gap-4">
          <ActionButton label="View Profile" link="/manufacturer/profile" />
          <ActionButton label="Product Management" link="/manufacturer/products" />
          <ActionButton label="View Orders" link="/manufacturer/orders" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    indigo: "bg-indigo-100 text-indigo-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="bg-white rounded-xl shadow border p-6 flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${colorMap[color]}`}>{icon}</div>
    </div>
  );
}

function SummaryRow({ label, value, color }) {
  const colorMap = {
    green: "text-green-600",
    orange: "text-orange-500",
    red: "text-red-500",
  };

  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-gray-600">{label}</span>
      <span className={`font-bold text-right ${colorMap[color] || "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );
}

function ActionButton({ label, link }) {
  return (
    <a
      href={link}
      className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
    >
      {label}
    </a>
  );
}
