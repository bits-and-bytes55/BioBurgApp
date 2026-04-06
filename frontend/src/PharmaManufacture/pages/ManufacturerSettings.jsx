import React, { useEffect, useMemo, useState } from "react";
import manufacturerApi, {
  getManufacturerToken,
  persistManufacturerSession,
} from "../manufacturerApi";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleHeader,
  ConsoleLoading,
  ConsoleNotice,
  ConsolePage,
  ConsolePanel,
  consoleInputClass,
} from "../../Franchise/components/consoleUi";

const initialProfileForm = {
  fullName: "",
  companyName: "",
  officialContact: "",
  authName: "",
  authDesignation: "",
  authMobile: "",
  authEmail: "",
  headOfficeAddress: "",
  factoryAddress: "",
  productionCapacity: "",
  moq: "",
  businessTerms: "",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  ifscCode: "",
  paymentMethod: "",
};

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const formatStatus = (value) =>
  String(value || "PENDING")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

function Field({ label, children, helper }) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
        {label}
      </span>
      {children}
      {helper ? (
        <span className="text-xs leading-5 text-slate-500">{helper}</span>
      ) : null}
    </label>
  );
}

function ReadOnlyBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-100">
        {value || "-"}
      </div>
    </div>
  );
}

export default function ManufacturerSettings() {
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const bankingReady = useMemo(
    () =>
      Boolean(
        profileForm.bankName &&
          profileForm.accountHolder &&
          profileForm.accountNumber &&
          profileForm.ifscCode,
      ),
    [profileForm],
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await manufacturerApi.get("/manufacturer/profile");
      const nextProfile = response.data.manufacturer || null;

      setProfile(nextProfile);
      setProfileForm({
        fullName: nextProfile?.fullName || "",
        companyName: nextProfile?.companyName || "",
        officialContact: nextProfile?.officialContact || "",
        authName: nextProfile?.authName || "",
        authDesignation: nextProfile?.authDesignation || "",
        authMobile: nextProfile?.authMobile || "",
        authEmail: nextProfile?.authEmail || "",
        headOfficeAddress: nextProfile?.headOfficeAddress || "",
        factoryAddress: nextProfile?.factoryAddress || "",
        productionCapacity: nextProfile?.productionCapacity || "",
        moq: nextProfile?.moq || "",
        businessTerms: nextProfile?.businessTerms || "",
        bankName: nextProfile?.bankName || "",
        accountHolder: nextProfile?.accountHolder || "",
        accountNumber: nextProfile?.accountNumber || "",
        ifscCode: nextProfile?.ifscCode || "",
        paymentMethod: nextProfile?.paymentMethod || "",
      });
    } catch (fetchError) {
      console.error("Manufacturer settings fetch error:", fetchError);
      setError(
        fetchError.response?.data?.message ||
          "Unable to load manufacturer settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      setError("");
      setProfileSuccess("");

      const response = await manufacturerApi.put(
        "/manufacturer/profile",
        profileForm,
      );

      const updatedManufacturer = response.data.manufacturer || profile;
      setProfile(updatedManufacturer);
      setProfileSuccess(response.data.message || "Profile updated successfully.");

      const token = getManufacturerToken();
      if (token && updatedManufacturer) {
        persistManufacturerSession(token, updatedManufacturer);
      }
    } catch (saveError) {
      console.error("Manufacturer profile save error:", saveError);
      setError(
        saveError.response?.data?.message ||
          "Unable to update manufacturer profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async () => {
    try {
      setSavingPassword(true);
      setError("");
      setPasswordSuccess("");

      const response = await manufacturerApi.post(
        "/manufacturer/account/change-password",
        passwordForm,
      );

      setPasswordSuccess(
        response.data.message || "Password updated successfully.",
      );
      setPasswordForm(initialPasswordForm);
    } catch (saveError) {
      console.error("Manufacturer password update error:", saveError);
      setError(
        saveError.response?.data?.message || "Unable to update password.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <ConsoleLoading label="Loading manufacturer account settings..." />;
  }

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          eyebrow="Manufacturer Settings"
          title="Keep your account, banking snapshot, and operating contacts current."
          description="This workspace is your single source for live portal identity details. Update manufacturer contact points, keep operational notes fresh, and change the portal password without waiting on admin intervention."
          badges={
            <>
              <ConsoleBadge tone={bankingReady ? "green" : "amber"}>
                Banking {bankingReady ? "ready" : "pending"}
              </ConsoleBadge>
              <ConsoleBadge
                tone={profile?.accountStatus === "ACTIVE" ? "green" : "amber"}
              >
                {formatStatus(profile?.accountStatus)}
              </ConsoleBadge>
              <ConsoleBadge tone="blue">
                {formatStatus(profile?.documentReviewStatus)}
              </ConsoleBadge>
            </>
          }
        />

        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}
        {profileSuccess ? (
          <ConsoleNotice tone="success">{profileSuccess}</ConsoleNotice>
        ) : null}
        {passwordSuccess ? (
          <ConsoleNotice tone="success">{passwordSuccess}</ConsoleNotice>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="grid gap-6">
            <ConsolePanel
              title="Profile and operating details"
              subtitle="Update the main business identity and partner-facing contact information used inside the manufacturer portal."
              action={
                <ConsoleButton onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save profile"}
                </ConsoleButton>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name">
                  <input
                    className={consoleInputClass}
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Company name">
                  <input
                    className={consoleInputClass}
                    value={profileForm.companyName}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Official contact">
                  <input
                    className={consoleInputClass}
                    value={profileForm.officialContact}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        officialContact: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Authorized person">
                  <input
                    className={consoleInputClass}
                    value={profileForm.authName}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        authName: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Authorized designation">
                  <input
                    className={consoleInputClass}
                    value={profileForm.authDesignation}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        authDesignation: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Authorized mobile">
                  <input
                    className={consoleInputClass}
                    value={profileForm.authMobile}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        authMobile: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Authorized email">
                  <input
                    className={consoleInputClass}
                    value={profileForm.authEmail}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        authEmail: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Production capacity">
                  <input
                    className={consoleInputClass}
                    value={profileForm.productionCapacity}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        productionCapacity: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="MOQ">
                  <input
                    className={consoleInputClass}
                    value={profileForm.moq}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        moq: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Payment method">
                  <input
                    className={consoleInputClass}
                    value={profileForm.paymentMethod}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        paymentMethod: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Head office address">
                  <textarea
                    className={`${consoleInputClass} min-h-[110px] resize-y`}
                    value={profileForm.headOfficeAddress}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        headOfficeAddress: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Factory address">
                  <textarea
                    className={`${consoleInputClass} min-h-[110px] resize-y`}
                    value={profileForm.factoryAddress}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        factoryAddress: event.target.value,
                      }))
                    }
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Business terms">
                    <textarea
                      className={`${consoleInputClass} min-h-[120px] resize-y`}
                      value={profileForm.businessTerms}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          businessTerms: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
              </div>
            </ConsolePanel>

            <ConsolePanel
              title="Banking details"
              subtitle="Keep the payout and settlement snapshot clean for future finance workflows."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Bank name">
                  <input
                    className={consoleInputClass}
                    value={profileForm.bankName}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        bankName: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Account holder">
                  <input
                    className={consoleInputClass}
                    value={profileForm.accountHolder}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        accountHolder: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Account number">
                  <input
                    className={consoleInputClass}
                    value={profileForm.accountNumber}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        accountNumber: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="IFSC code">
                  <input
                    className={consoleInputClass}
                    value={profileForm.ifscCode}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        ifscCode: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
            </ConsolePanel>

            <ConsolePanel
              title="Password and access"
              subtitle="Use your current password to rotate portal credentials without losing session access."
              action={
                <ConsoleButton onClick={updatePassword} disabled={savingPassword}>
                  {savingPassword ? "Updating..." : "Change password"}
                </ConsoleButton>
              }
            >
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Current password">
                  <input
                    type="password"
                    className={consoleInputClass}
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="New password" helper="Minimum 6 characters">
                  <input
                    type="password"
                    className={consoleInputClass}
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        newPassword: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Confirm password">
                  <input
                    type="password"
                    className={consoleInputClass}
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
            </ConsolePanel>
          </div>

          <div className="grid gap-6">
            <ConsolePanel
              title="Portal identity"
              subtitle="Read-only values that anchor the current manufacturer account."
            >
              <div className="grid gap-3">
                <ReadOnlyBlock label="Official email" value={profile?.officialEmail} />
                <ReadOnlyBlock label="Portal username" value={profile?.username} />
                <ReadOnlyBlock
                  label="Application status"
                  value={formatStatus(profile?.applicationStatus)}
                />
                <ReadOnlyBlock
                  label="Document review"
                  value={formatStatus(profile?.documentReviewStatus)}
                />
                <ReadOnlyBlock
                  label="Account status"
                  value={formatStatus(profile?.accountStatus)}
                />
              </div>
            </ConsolePanel>

            <ConsolePanel
              title="Account notes"
              subtitle="Current admin-facing lifecycle context tied to this manufacturer profile."
            >
              <div className="grid gap-3 text-sm leading-6 text-slate-500">
                <p>
                  Review notes:{" "}
                  <span className="font-medium text-slate-300">
                    {profile?.reviewNotes || "No review notes added yet."}
                  </span>
                </p>
                <p>
                  Rejection reason:{" "}
                  <span className="font-medium text-slate-300">
                    {profile?.rejectionReason || "No rejection history on record."}
                  </span>
                </p>
                <p>
                  Banking readiness helps future settlement workflows once
                  manufacturer-led finance operations expand.
                </p>
              </div>
            </ConsolePanel>
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}
