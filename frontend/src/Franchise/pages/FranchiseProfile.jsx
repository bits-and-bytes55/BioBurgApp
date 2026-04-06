import React, { useEffect, useState } from "react";
import franchiseApi, { persistFranchiseUser } from "../franchiseApi";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleHeader,
  ConsoleLoading,
  ConsoleNotice,
  ConsolePage,
  ConsolePanel,
  consoleInputClass,
  consoleTextareaClass,
} from "../components/consoleUi";

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function FranchiseProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [documentFiles, setDocumentFiles] = useState({
    profilePhoto: null,
    governmentId: null,
    addressProof: null,
    businessProof: null,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      const res = await franchiseApi.get("/franchise/profile");
      const nextProfile = res.data.profile;
      setProfile(nextProfile);
      persistFranchiseUser({
        email: nextProfile.email,
        status: nextProfile.status,
        zoneId: nextProfile.zoneId?._id || nextProfile.zoneId || null,
        zoneName: nextProfile.zoneId?.name || "",
        application: nextProfile.application || {},
      });
      setForm({
        fullName: nextProfile.application?.fullName || "",
        mobile: nextProfile.application?.mobile || "",
        locality: nextProfile.application?.locality || "",
        citiesOfInterest: nextProfile.application?.citiesOfInterest || "",
        investmentBandwidth: nextProfile.application?.investmentBandwidth || "",
        whyBioburg: nextProfile.application?.whyBioburg || "",
        marketConnect: nextProfile.application?.marketConnect || "",
        locationType: nextProfile.application?.locationType || "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateProfile = async () => {
    try {
      setMessage("");
      setError("");
      const uploadedEntries = await Promise.all(
        Object.entries(documentFiles)
          .filter(([, file]) => Boolean(file))
          .map(async ([key, file]) => [
            key,
            await uploadToCloudinary(file, "bioburg/franchise"),
          ]),
      );

      const documents = Object.fromEntries(uploadedEntries);

      await franchiseApi.put("/franchise/profile", {
        ...form,
        ...(Object.keys(documents).length > 0 ? { documents } : {}),
      });

      setDocumentFiles({
        profilePhoto: null,
        governmentId: null,
        addressProof: null,
        businessProof: null,
      });
      setMessage("Profile updated successfully");
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Profile update failed");
    }
  };

  const updatePassword = async () => {
    try {
      setMessage("");
      setError("");

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("New password and confirm password must match");
        return;
      }

      await franchiseApi.put("/franchise/profile/password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage("Password updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Password update failed");
    }
  };

  if (!profile && !error) {
    return (
      <ConsolePage>
        <ConsoleLoading label="Loading franchise profile..." />
      </ConsolePage>
    );
  }

  if (!profile && error) {
    return (
      <ConsolePage>
        <div className="grid gap-4">
          <ConsoleNotice tone="error">{error}</ConsoleNotice>
          <div>
            <ConsoleButton onClick={fetchProfile}>Retry</ConsoleButton>
          </div>
        </div>
      </ConsolePage>
    );
  }

  return (
    <ConsolePage>
      <div className="grid gap-6">
        {message ? <ConsoleNotice tone="success">{message}</ConsoleNotice> : null}
        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <ConsoleHeader
          title="Franchise Profile"
          description={profile.email}
          badges={
            <>
              <ConsoleBadge tone={profile.status === "ACTIVE" ? "green" : "amber"}>
                {profile.status}
              </ConsoleBadge>
              <ConsoleBadge
                tone={
                  profile.application?.kycStatus === "VERIFIED"
                    ? "green"
                    : profile.application?.kycStatus === "REJECTED"
                      ? "rose"
                      : "amber"
                }
              >
                KYC {profile.application?.kycStatus || "PENDING"}
              </ConsoleBadge>
              <ConsoleBadge tone={profile.zoneId?.name ? "blue" : "neutral"}>
                {profile.zoneId?.name || "Zone not assigned"}
              </ConsoleBadge>
            </>
          }
        />

        <ConsolePanel title="Identity & business profile">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Full Name">
              <input
                className={consoleInputClass}
                value={form.fullName || ""}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              />
            </Field>
            <Field label="Mobile">
              <input
                className={consoleInputClass}
                value={form.mobile || ""}
                onChange={(event) => setForm({ ...form, mobile: event.target.value })}
              />
            </Field>
            <Field label="Email">
              <input className={consoleInputClass} value={profile.email} disabled />
            </Field>
            <Field label="City of Interest">
              <input
                className={consoleInputClass}
                value={form.citiesOfInterest || ""}
                onChange={(event) =>
                  setForm({ ...form, citiesOfInterest: event.target.value })
                }
              />
            </Field>
            <Field label="Locality">
              <input
                className={consoleInputClass}
                value={form.locality || ""}
                onChange={(event) => setForm({ ...form, locality: event.target.value })}
              />
            </Field>
            <Field label="Assigned Zone">
              <input
                className={consoleInputClass}
                value={profile.zoneId?.name || "Not Assigned"}
                disabled
              />
            </Field>
            <Field label="Investment Bandwidth">
              <input
                className={consoleInputClass}
                value={form.investmentBandwidth || ""}
                onChange={(event) =>
                  setForm({ ...form, investmentBandwidth: event.target.value })
                }
              />
            </Field>
            <Field label="Market Connect">
              <input
                className={consoleInputClass}
                value={form.marketConnect || ""}
                onChange={(event) =>
                  setForm({ ...form, marketConnect: event.target.value })
                }
              />
            </Field>
            <Field label="Location Type">
              <input
                className={consoleInputClass}
                value={form.locationType || ""}
                onChange={(event) =>
                  setForm({ ...form, locationType: event.target.value })
                }
              />
            </Field>
            <div className="md:col-span-3">
              <Field label="Why BioBurg">
                <textarea
                  className={consoleTextareaClass}
                  rows={4}
                  value={form.whyBioburg || ""}
                  onChange={(event) => setForm({ ...form, whyBioburg: event.target.value })}
                />
              </Field>
            </div>
          </div>

          <div className="mt-5">
            <ConsoleButton onClick={updateProfile}>Save Profile</ConsoleButton>
          </div>
        </ConsolePanel>

        <ConsolePanel title="KYC documents" subtitle="Upload fresh files or review the currently stored ones">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["profilePhoto", "Profile Photo"],
              ["governmentId", "Government ID"],
              ["addressProof", "Address Proof"],
              ["businessProof", "Business Proof"],
            ].map(([key, label]) => (
              <div
                key={key}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="text-sm font-semibold text-slate-100">{label}</div>
                <div className="mt-3">
                  <label className="inline-flex cursor-pointer items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-amber-500/30 hover:text-amber-400">
                    Upload {label}
                    <input
                      hidden
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(event) =>
                        setDocumentFiles((prev) => ({
                          ...prev,
                          [key]: event.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="mt-3 text-sm text-slate-500">
                  {documentFiles[key]?.name ||
                    profile.application?.documents?.[key] ||
                    "No file uploaded"}
                </div>
                {profile.application?.documents?.[key] ? (
                  <div className="mt-3">
                    <a
                      href={profile.application.documents[key]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-sky-400 transition-colors hover:text-sky-300"
                    >
                      View current {label}
                    </a>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {profile.application?.kycNotes ? (
            <div className="mt-4">
              <ConsoleNotice tone="info">{profile.application.kycNotes}</ConsoleNotice>
            </div>
          ) : null}
        </ConsolePanel>

        <ConsolePanel title="Password settings" subtitle="Rotate the franchise login password securely">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Current Password">
              <input
                className={consoleInputClass}
                type="password"
                value={passwordForm.oldPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    oldPassword: event.target.value,
                  })
                }
              />
            </Field>
            <Field label="New Password">
              <input
                className={consoleInputClass}
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: event.target.value,
                  })
                }
              />
            </Field>
            <Field label="Confirm Password">
              <input
                className={consoleInputClass}
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: event.target.value,
                  })
                }
              />
            </Field>
          </div>

          <div className="mt-5">
            <ConsoleButton variant="secondary" onClick={updatePassword}>
              Update Password
            </ConsoleButton>
          </div>
        </ConsolePanel>
      </div>
    </ConsolePage>
  );
}
