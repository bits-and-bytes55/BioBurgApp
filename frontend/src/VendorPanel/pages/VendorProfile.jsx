import React, { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import { useVendor } from "../context/VendorContext";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  import.meta.env.VITE_API_BASE_URL;

export default function VendorProfile() {
  // ── Context — single source of truth ──────────────────────────
  const { vendor, setVendor, updateVendor } = useVendor();

  const [isEditing, setIsEditing] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef();

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const token = localStorage.getItem("vendorToken");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // Show loading state until context has full vendor data (has email = fully loaded)
  if (!vendor?.email)
    return <p className="p-8 text-gray-500">Loading profile...</p>;

  const handleChange = (e) =>
    setVendor((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePasswordChange = (e) =>
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Save profile ───────────────────────────────────────────────
  const saveProfile = async () => {
    try {
      const payload = { ...vendor, ...passwords };
      const res = await axios.put(
        `${API_BASE}/api/vendor/update`,
        payload,
        authHeader,
      );
      if (res.data.success) {
        // Sync fullName back to context/localStorage if it changed
        updateVendor({ fullName: vendor.fullName });
        toast.success("Profile updated!");
        setIsEditing(false);
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed!");
    }
  };

  // ── Convert file → base64 ──────────────────────────────────────
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ── Upload photo ───────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setPhotoLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await axios.post(
        `${API_BASE}/api/vendor/profile/photo`,
        { photo: base64 },
        authHeader,
      );
      if (res.data.success) {
        updateVendor({ ownerPhoto: res.data.url }); // updates context + localStorage + sidebar + header
        toast.success("Photo updated!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Photo upload failed");
    } finally {
      setPhotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Delete photo ───────────────────────────────────────────────
  const handlePhotoDelete = async () => {
    if (!vendor.ownerPhoto) return;
    if (!window.confirm("Remove your profile photo?")) return;

    setPhotoLoading(true);
    try {
      await axios.delete(`${API_BASE}/api/vendor/profile/photo`, authHeader);
      updateVendor({ ownerPhoto: "" }); // updates context + localStorage + sidebar + header
      toast.success("Photo removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 mb-8 flex justify-between items-center">
        Seller Profile
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-base"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPasswords({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg text-base"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-base"
              >
                Save
              </button>
            </>
          )}
        </div>
      </h1>

      <div className="bg-white rounded-xl shadow-xl border p-8 max-w-5xl">
        {/* ── Profile Photo ─────────────────────────────────────── */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b">
          <Box sx={{ position: "relative", display: "inline-block" }}>
            {photoLoading ? (
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "#f3f4f6",
                  border: "2px dashed #d1d5db",
                }}
              >
                <CircularProgress size={32} />
              </Box>
            ) : (
              <Avatar
                src={vendor.ownerPhoto || undefined}
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: 36,
                  bgcolor: "#4f46e5",
                }}
              >
                {!vendor.ownerPhoto &&
                  (vendor.fullName?.[0]?.toUpperCase() || "V")}
              </Avatar>
            )}

            <Tooltip title="Upload new photo">
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoLoading}
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: vendor.ownerPhoto ? 24 : -4,
                  bgcolor: "#4f46e5",
                  color: "#fff",
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "#3730a3" },
                  "&:disabled": { bgcolor: "#a5b4fc" },
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>

            {vendor.ownerPhoto && (
              <Tooltip title="Remove photo">
                <IconButton
                  size="small"
                  onClick={handlePhotoDelete}
                  disabled={photoLoading}
                  sx={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    bgcolor: "#dc2626",
                    color: "#fff",
                    width: 28,
                    height: 28,
                    "&:hover": { bgcolor: "#b91c1c" },
                    "&:disabled": { bgcolor: "#fca5a5" },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
          </Box>

          <div>
            <p className="text-xl font-bold text-gray-800">{vendor.fullName}</p>
            <p className="text-gray-500 text-sm">{vendor.email}</p>
            <p className="text-gray-500 text-sm mt-0.5">
              {vendor.businessName}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG or WEBP · Max 5MB
            </p>
          </div>
        </div>

        {/* PERSONAL DETAILS */}
        <h2 className="text-xl font-bold mb-4">Personal Details</h2>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <InputField
            label="Full Name"
            name="fullName"
            value={vendor.fullName}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Email"
            name="email"
            value={vendor.email}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Phone"
            name="phone"
            value={vendor.phone}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Alternate Phone"
            name="altPhone"
            value={vendor.altPhone}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Gender"
            name="gender"
            value={vendor.gender}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>

        {isEditing && (
          <>
            <h2 className="text-xl font-bold mb-4">Update Password</h2>
            <p className="text-sm text-gray-500 mb-4">
              Leave blank to keep current password.
            </p>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <InputField
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
              />
              <InputField
                label="New Password"
                name="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
              />
              <InputField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>
          </>
        )}

        {/* BUSINESS DETAILS */}
        <h2 className="text-xl font-bold mb-4">Business Information</h2>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <InputField
            label="Business Name"
            name="businessName"
            value={vendor.businessName}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Business Type"
            name="businessType"
            value={vendor.businessType}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Registration Type"
            name="registrationType"
            value={vendor.registrationType}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="GST Number"
            name="gstNumber"
            value={vendor.gstNumber}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="PAN Number"
            name="panNumber"
            value={vendor.panNumber}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Drug License 1"
            name="drugLicenseNumber1"
            value={vendor.drugLicenseNumber1}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Drug License 2"
            name="drugLicenseNumber2"
            value={vendor.drugLicenseNumber2}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Drug License 3"
            name="drugLicenseNumber3"
            value={vendor.drugLicenseNumber3}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Drug License 4"
            name="drugLicenseNumber4"
            value={vendor.drugLicenseNumber4}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Address"
            name="address"
            value={vendor.address}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="City"
            name="city"
            value={vendor.city}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="State"
            name="state"
            value={vendor.state}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Pincode"
            name="pincode"
            value={vendor.pincode}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>

        {/* BANK DETAILS */}
        <h2 className="text-xl font-bold mb-4">Bank Details</h2>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <InputField
            label="Account Holder"
            name="accountHolderName"
            value={vendor.accountHolderName}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Account Number"
            name="accountNumber"
            value={vendor.accountNumber}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="IFSC Code"
            name="ifscCode"
            value={vendor.ifscCode}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            label="Branch Name"
            name="branchName"
            value={vendor.branchName}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>

        {/* DOCUMENTS */}
        <h2 className="text-xl font-bold mb-4">Documents</h2>
        <div className="grid grid-cols-2 gap-6">
          <DocumentBox label="GST Certificate" url={vendor.gstCertificate} />
          <DocumentBox label="Drug License 1" url={vendor.drugLicense1} />
          <DocumentBox label="Drug License 2" url={vendor.drugLicense2} />
          <DocumentBox label="Drug License 3" url={vendor.drugLicense3} />
          <DocumentBox label="Drug License 4" url={vendor.drugLicense4} />
          <DocumentBox label="PAN Card" url={vendor.pancard} />
          <DocumentBox label="Aadhar Card" url={vendor.aadharCard} />
          <DocumentBox label="Voter ID" url={vendor.voterId} />
          <DocumentBox
            label="Education Certificate"
            url={vendor.educationCertificate}
          />
          <DocumentBox label="Business Logo" url={vendor.businessLogo} />
        </div>

        <h3 className="text-lg font-bold mt-6 mb-3">Shop Photos</h3>
        <div className="grid grid-cols-3 gap-4">
          <DocumentBox label="Shop Photo 1" url={vendor.shopPhoto1} />
          <DocumentBox label="Shop Photo 2" url={vendor.shopPhoto2} />
          <DocumentBox label="Shop Photo 3" url={vendor.shopPhoto3} />
          <DocumentBox label="Shop Photo 4" url={vendor.shopPhoto4} />
          <DocumentBox label="Shop Photo 5" url={vendor.shopPhoto5} />
          {vendor.shopVideo && (
            <video
              src={vendor.shopVideo}
              controls
              className="rounded-lg w-full"
            />
          )}
        </div>
      </div>
    </>
  );
}

function InputField({ label, name, value, onChange, disabled, type = "text" }) {
  return (
    <div>
      <label className="text-gray-600 text-sm font-medium">{label}</label>
      <input
        className="w-full px-4 py-2 border rounded-lg shadow-sm mt-1 disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        type={type}
      />
    </div>
  );
}

function DocumentBox({ label, url }) {
  if (!url) return null;
  const isImage =
    /\.(jpg|jpeg|png|webp)$/i.test(url) || url.includes("cloudinary");
  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <p className="text-gray-700 font-medium mb-2 text-sm">{label}</p>
      {isImage ? (
        <img
          src={url}
          alt={label}
          className="h-28 w-auto object-cover rounded"
        />
      ) : (
        <a
          href={url}
          target="_blank"
          className="text-blue-600 underline text-sm"
          rel="noreferrer"
        >
          View File
        </a>
      )}
    </div>
  );
}
