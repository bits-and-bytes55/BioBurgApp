import React, { useEffect, useState } from "react";
import manufacturerApi from "../manufacturerApi";
import { resolveApiUrl } from "../../config/api";

const formatStatus = (value) =>
  String(value || "PENDING")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function ManufacturerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await manufacturerApi.get("/manufacturer/profile");

        if (isMounted) {
          setProfile(res.data.manufacturer || null);
          setError("");
        }
      } catch (err) {
        console.error("Manufacturer profile error:", err);
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Failed to load manufacturer profile.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading profile...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!profile) {
    return <p className="text-gray-500">No manufacturer profile found.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-6">Company Profile</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Info label="Company Name" value={profile.companyName} />
          <Info label="Company Type" value={profile.companyType} />
          <Info label="Official Email" value={profile.officialEmail} />
          <Info label="Contact Number" value={profile.officialContact} />
          <Info label="Portal Username" value={profile.username} />
          <Info label="Year Established" value={profile.yearEst} />
          <Info label="Head Office Address" value={profile.headOfficeAddress} />
          <Info label="Factory Address" value={profile.factoryAddress} />
          <Info label="Authorized Person" value={profile.authName} />
          <Info label="Authorized Contact" value={profile.authMobile} />
          <Info label="Production Capacity" value={profile.productionCapacity} />
          <Info label="MOQ" value={profile.moq} />
          <Info
            label="Verification Status"
            value={
              profile.accountStatus === "ACTIVE" ? (
                <span className="text-green-600 font-semibold">Active</span>
              ) : (
                <span className="text-orange-500 font-semibold">
                  {formatStatus(profile.applicationStatus)}
                </span>
              )
            }
          />
          <Info
            label="Document Review"
            value={formatStatus(profile.documentReviewStatus)}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-6">Uploaded Documents</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <DocCard
            title="Product List"
            file={profile.documents?.productListFile}
          />
          <DocCard
            title="Manufacturing License"
            file={profile.documents?.licenseFile}
          />
          <DocCard
            title="GMP / WHO GMP Certificate"
            file={profile.documents?.gmpCertFile}
          />
          <DocCard
            title="ISO / FDA Certificate"
            file={profile.documents?.isoCertFile}
          />
          <DocCard
            title="Quality Test Documents"
            file={profile.documents?.qualityTestDocs}
          />
        </div>
      </div>
    </div>
  );
}

const Info = ({ label, value }) => (
  <div>
    <p className="text-gray-500 text-sm">{label}</p>
    <p className="font-semibold">{value || "-"}</p>
  </div>
);

const DocCard = ({ title, file }) => (
  <div className="border rounded-lg p-4">
    <p className="font-semibold mb-2">{title}</p>

    {file?.url ? (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600 truncate">
          {file.originalName || "Document"}
        </p>

        <a
          href={resolveApiUrl(file.url)}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 font-semibold hover:underline"
        >
          View
        </a>
      </div>
    ) : (
      <p className="text-gray-400 text-sm">Not uploaded</p>
    )}
  </div>
);
