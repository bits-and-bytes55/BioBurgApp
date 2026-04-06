// frontend/src/Delivery/DeliverySignup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { uploadAllDocuments } from "../../utils/uploadToCloudinary";

const API = import.meta.env.VITE_API_BASE_URL + "/api";

// ── Field Components (from your first design) ─────────────────────
const Field = ({ label, err, required, ...p }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
      {label}
      {required && <span className="text-teal-600 ml-0.5">*</span>}
    </label>
    <input
      {...p}
      className={`w-full bg-white border ${err ? "border-red-400 bg-red-50" : "border-slate-200"} rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200`}
    />
    {err && <p className="text-red-500 text-[11px] font-medium">{err}</p>}
  </div>
);

const SelectField = ({ label, err, required, children, ...p }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
      {label}
      {required && <span className="text-teal-600 ml-0.5">*</span>}
    </label>
    <select
      {...p}
      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200"
    >
      {children}
    </select>
    {err && <p className="text-red-500 text-[11px] font-medium">{err}</p>}
  </div>
);

// ── File Field — shows upload status (uploading / uploaded / error) ─
const FileField = ({
  label,
  required,
  file,
  uploading,
  uploaded,
  uploadErr,
  onChange,
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
      {label}
      {required && <span className="text-teal-600 ml-0.5">*</span>}
    </label>
    <label
      className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer transition-all duration-200
      ${
        uploaded
          ? "border-teal-400 bg-teal-50"
          : uploading
            ? "border-amber-300 bg-amber-50 cursor-not-allowed"
            : uploadErr
              ? "border-red-300 bg-red-50"
              : file
                ? "border-teal-300 bg-teal-50/40"
                : "border-dashed border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/50"
      }`}
    >
      <span
        className={`text-sm truncate pr-3
        ${
          uploaded
            ? "text-teal-700 font-medium"
            : uploading
              ? "text-amber-700 font-medium"
              : uploadErr
                ? "text-red-600"
                : file
                  ? "text-teal-700 font-medium"
                  : "text-slate-400"
        }`}
      >
        {uploaded
          ? `✓ Uploaded to cloud`
          : uploading
            ? `Uploading…`
            : uploadErr
              ? `Upload failed — click to retry`
              : file
                ? file.name
                : "No file selected — JPEG, PNG or PDF · Max 5 MB"}
      </span>
      <span
        className={`text-[10px] font-bold uppercase tracking-widest shrink-0 border rounded px-2 py-1 transition-all
        ${
          uploaded
            ? "border-teal-400 text-teal-600"
            : uploading
              ? "border-amber-300 text-amber-600"
              : uploadErr
                ? "border-red-300 text-red-500"
                : "border-slate-300 text-slate-400"
        }`}
      >
        {uploaded
          ? "Done"
          : uploading
            ? "Wait"
            : uploadErr
              ? "Retry"
              : "Browse"}
      </span>
      <input
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={onChange}
        disabled={uploading}
      />
    </label>
    {uploadErr && (
      <p className="text-red-500 text-[11px] font-medium">{uploadErr}</p>
    )}
  </div>
);

export default function DeliverySignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [srvErr, setSrvErr] = useState("");
  const [errs, setErrs] = useState({});

  const [f, setF] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
    vehicleType: "Bike",
    vehicleNumber: "",
    drivingLicence: "",
    panNumber: "",
    bankAccount: "",
    ifsc: "",
    bankName: "",
    accountHolderName: "",
    upiId: "",
    zone: "",
  });

  // File objects (for display)
  const [files, setFiles] = useState({
    aadhaar: null,
    licenceCopy: null,
    vehicleRC: null,
    passportPhoto: null,
    upiQrImage: null,
  });

  // Upload state per document
  const initU = () => ({
    uploading: false,
    uploaded: false,
    url: null,
    error: null,
  });
  const [us, setUs] = useState({
    aadhaar: initU(),
    licenceCopy: initU(),
    vehicleRC: initU(),
    passportPhoto: initU(),
    upiQrImage: initU(),
  });

  const upd = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setErrs((p) => ({ ...p, [k]: "" }));
  };
  const upper = (k) => (e) =>
    setF((p) => ({ ...p, [k]: e.target.value.toUpperCase() }));

  // File selected → immediately upload to Cloudinary
  const onFile = async (key, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUs((p) => ({
        ...p,
        [key]: { ...initU(), error: "File too large (max 5 MB)" },
      }));
      return;
    }
    setFiles((p) => ({ ...p, [key]: file }));
    setUs((p) => ({
      ...p,
      [key]: { uploading: true, uploaded: false, url: null, error: null },
    }));
    try {
      const result = await uploadAllDocuments(
        { [key]: file },
        "bioburg/delivery-agents",
      );
      setUs((p) => ({
        ...p,
        [key]: {
          uploading: false,
          uploaded: true,
          url: result[`${key}Url`],
          error: null,
        },
      }));
    } catch (err) {
      setUs((p) => ({
        ...p,
        [key]: {
          uploading: false,
          uploaded: false,
          url: null,
          error: err.message || "Upload failed",
        },
      }));
    }
  };

  const anyUploading = Object.values(us).some((s) => s.uploading);

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!f.name.trim()) e.name = "Full name is required";
      if (!/^\d{10}$/.test(f.phone)) e.phone = "Enter a valid 10-digit number";
      if (!/\S+@\S+\.\S+/.test(f.email))
        e.email = "Enter a valid email address";
      if (f.password.length < 6) e.password = "Minimum 6 characters required";
      if (f.password !== f.confirm) e.confirm = "Passwords do not match";
    }
    if (s === 2) {
      if (!f.vehicleNumber.trim())
        e.vehicleNumber = "Vehicle registration number is required";
      if (!f.drivingLicence.trim())
        e.drivingLicence = "Driving licence number is required";
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(f.panNumber))
        e.panNumber = "Invalid PAN format (e.g. ABCDE1234F)";
      if (!us.aadhaar.uploaded) e.aadhaarDoc = "Aadhaar upload is required";
      if (!us.licenceCopy.uploaded)
        e.licenceDoc = "Licence copy upload is required";
      if (!us.passportPhoto.uploaded) e.photoDoc = "Passport photo is required";
    }
    if (s === 3) {
      if (!f.bankAccount.trim()) e.bankAccount = "Account number is required";
      if (!f.ifsc.trim()) e.ifsc = "IFSC code is required";
      if (!f.bankName.trim()) e.bankName = "Bank name is required";
    }
    setErrs(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (validate(step)) setStep((s) => s + 1);
  };
  const back = () => setStep((s) => s - 1);

  const submit = async () => {
    if (!validate(3)) return;
    if (anyUploading) {
      setSrvErr("Please wait — documents are still uploading.");
      return;
    }
    setLoading(true);
    setSrvErr("");
    try {
      await axios.post(`${API}/delivery/register`, {
        name: f.name,
        phone: f.phone,
        email: f.email,
        password: f.password,
        zone: f.zone,
        vehicleType: f.vehicleType,
        vehicleNumber: f.vehicleNumber,
        drivingLicence: f.drivingLicence,
        panNumber: f.panNumber,
        bankAccount: f.bankAccount,
        ifsc: f.ifsc,
        upiId: f.upiId,
        accountHolderName: f.accountHolderName,
        // Cloudinary URLs
        aadhaarUrl: us.aadhaar.url,
        licenceCopyUrl: us.licenceCopy.url,
        vehicleRCUrl: us.vehicleRC.url,
        passportPhotoUrl: us.passportPhoto.url,
        upiQrImageUrl: us.upiQrImage.url,
      });
      setDone(true);
    } catch (err) {
      setSrvErr(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────
  if (done)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-12 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full border-2 border-teal-200 bg-teal-50 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-6 h-6 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            Application Submitted
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Your documents have been uploaded and your application is under
            review. Our team will respond within{" "}
            <span className="text-slate-800 font-semibold">24–48 hours</span>.
          </p>

          {/* Notification confirmation */}
          <div className="space-y-2.5 mb-6 text-left">
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <span className="text-lg">✉️</span>
              <div>
                <p className="text-blue-800 font-semibold text-xs">
                  Confirmation email sent
                </p>
                <p className="text-blue-500 text-[11px] truncate">{f.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <span className="text-lg">📱</span>
              <div>
                <p className="text-green-800 font-semibold text-xs">SMS sent</p>
                <p className="text-green-500 text-[11px]">{f.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-8">
            <p className="text-amber-700 text-sm font-semibold">
              Status: Pending Admin Approval
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              You'll be notified via email & SMS once approved
            </p>
          </div>
          <button
            onClick={() => navigate("/delivery/login")}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );

  const STEPS = [
    "Personal Information",
    "Vehicle & Documents",
    "Bank & Payment",
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* ── Sidebar (desktop only) ── */}
      <div className="hidden lg:flex lg:w-72 xl:w-80 bg-white border-r border-slate-200 flex-col justify-between p-8 shrink-0">
        <div>
          <div className="mb-10">
            <div className="w-8 h-1 bg-teal-500 rounded-full mb-4" />
            <h2 className="text-slate-800 text-xl font-bold">
              Delivery Partner
            </h2>
            <p className="text-slate-400 text-sm mt-1">Registration Portal</p>
          </div>

          {/* Step indicators */}
          <div className="space-y-1">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${i + 1 === step ? "bg-teal-50 border border-teal-100" : ""}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    i + 1 < step
                      ? "bg-teal-500 text-white"
                      : i + 1 === step
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {i + 1 < step ? (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold ${i + 1 === step ? "text-teal-700" : i + 1 < step ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {s}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Step {i + 1} of {STEPS.length}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission info */}
        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-3">
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
            Commission Structure
          </p>
          {[
            ["Base Commission", "7% per delivery"],
            ["Monthly Bonus", "₹400 on 100+ deliveries"],
            ["Payout Schedule", "Every Monday"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center">
              <span className="text-slate-500 text-xs">{k}</span>
              <span className="text-teal-600 text-xs font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-5 py-4">
          <div className="w-6 h-0.5 bg-teal-500 rounded-full mb-3" />
          <h1 className="text-slate-800 text-lg font-bold">
            Delivery Partner Registration
          </h1>
        </div>

        {/* Mobile step progress */}
        <div className="lg:hidden flex bg-white border-b border-slate-200 px-5 pb-4 pt-3 gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-0.5 rounded-full mb-1.5 transition-all duration-500 ${i + 1 <= step ? "bg-teal-500" : "bg-slate-200"}`}
              />
              <p
                className={`text-[9px] font-semibold uppercase tracking-wider text-center truncate ${i + 1 === step ? "text-teal-600" : i + 1 < step ? "text-slate-400" : "text-slate-300"}`}
              >
                {s}
              </p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-10">
          <div className="max-w-2xl mx-auto lg:max-w-none">
            {/* Step heading */}
            <div className="flex items-center gap-4 mb-8">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                  Step {step} of {STEPS.length}
                </p>
                <h2 className="text-slate-800 text-xl sm:text-2xl font-bold mt-0.5">
                  {STEPS[step - 1]}
                </h2>
              </div>
              <div className="flex-1 h-px bg-slate-200 ml-2" />
            </div>

            {/* ── STEP 1: Personal Information ── */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Field
                    label="Full Name"
                    required
                    placeholder="As per Aadhaar card"
                    value={f.name}
                    onChange={upd("name")}
                    err={errs.name}
                  />
                </div>
                <Field
                  label="Mobile Number"
                  required
                  placeholder="10-digit mobile number"
                  value={f.phone}
                  onChange={upd("phone")}
                  err={errs.phone}
                />
                <Field
                  label="Email Address"
                  required
                  type="email"
                  placeholder="your@email.com"
                  value={f.email}
                  onChange={upd("email")}
                  err={errs.email}
                />
                <Field
                  label="Password"
                  required
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={f.password}
                  onChange={upd("password")}
                  err={errs.password}
                />
                <Field
                  label="Confirm Password"
                  required
                  type="password"
                  placeholder="Re-enter password"
                  value={f.confirm}
                  onChange={upd("confirm")}
                  err={errs.confirm}
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Delivery Zone / Area"
                    placeholder="e.g. Sector 12, Noida"
                    value={f.zone}
                    onChange={upd("zone")}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: Vehicle & Documents ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                      {
                        value: "Bike",
                        label: "Bike / Scooter",
                        sub: "Two Wheeler",
                        icon: "🛵",
                      },
                      {
                        value: "Rikshaw",
                        label: "Rikshaw",
                        sub: "Three Wheeler",
                        icon: "🛺",
                      },
                      {
                        value: "Car",
                        label: "Car",
                        sub: "Four Wheeler",
                        icon: "🚗",
                      },
                      {
                        value: "Van",
                        label: "Van",
                        sub: "Four Wheeler",
                        icon: "🚐",
                      },
                      {
                        value: "Cycle",
                        label: "Bicycle",
                        sub: "Non-Motorized",
                        icon: "🚲",
                      },
                    ].map((v) => (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() =>
                          upd("vehicleType")({ target: { value: v.value } })
                        }
                        className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
              ${
                f.vehicleType === v.value
                  ? "border-teal-500 bg-teal-50 shadow-md scale-105"
                  : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/40"
              }`}
                      >
                        <span className="text-3xl">{v.icon}</span>
                        <span
                          className={`text-sm font-semibold mt-1 ${f.vehicleType === v.value ? "text-teal-700" : "text-gray-700"}`}
                        >
                          {v.label}
                        </span>
                        <span
                          className={`text-xs ${f.vehicleType === v.value ? "text-teal-500" : "text-gray-400"}`}
                        >
                          {v.sub}
                        </span>
                        {f.vehicleType === v.value && (
                          <span className="mt-1 text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full">
                            ✓ Selected
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field
                    label="Vehicle Registration No."
                    required
                    placeholder="e.g. UP32AB1234"
                    value={f.vehicleNumber}
                    onChange={upper("vehicleNumber")}
                    err={errs.vehicleNumber}
                  />
                  <Field
                    label="Driving Licence No."
                    required
                    placeholder="e.g. UP3220190012345"
                    value={f.drivingLicence}
                    onChange={upper("drivingLicence")}
                    err={errs.drivingLicence}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="PAN Card Number"
                      required
                      placeholder="e.g. ABCDE1234F"
                      value={f.panNumber}
                      onChange={upper("panNumber")}
                      err={errs.panNumber}
                    />
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.1em]">
                      Document Uploads
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileField
                      label="Aadhaar / ID Proof"
                      required
                      file={files.aadhaar}
                      {...us.aadhaar}
                      uploadErr={us.aadhaar.error || errs.aadhaarDoc}
                      onChange={(e) => onFile("aadhaar", e)}
                    />
                    <FileField
                      label="Driving Licence Copy"
                      required
                      file={files.licenceCopy}
                      {...us.licenceCopy}
                      uploadErr={us.licenceCopy.error || errs.licenceDoc}
                      onChange={(e) => onFile("licenceCopy", e)}
                    />
                    <FileField
                      label="Vehicle RC Copy"
                      file={files.vehicleRC}
                      {...us.vehicleRC}
                      uploadErr={us.vehicleRC.error}
                      onChange={(e) => onFile("vehicleRC", e)}
                    />
                    <FileField
                      label="Passport Size Photo"
                      required
                      file={files.passportPhoto}
                      {...us.passportPhoto}
                      uploadErr={us.passportPhoto.error || errs.photoDoc}
                      onChange={(e) => onFile("passportPhoto", e)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Bank & Payment ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Field
                      label="Account Holder Name"
                      placeholder="As per bank passbook"
                      value={f.accountHolderName}
                      onChange={upd("accountHolderName")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Bank Account Number"
                      required
                      placeholder="Enter account number"
                      value={f.bankAccount}
                      onChange={upd("bankAccount")}
                      err={errs.bankAccount}
                    />
                  </div>
                  <Field
                    label="IFSC Code"
                    required
                    placeholder="e.g. SBIN0001234"
                    value={f.ifsc}
                    onChange={upper("ifsc")}
                    err={errs.ifsc}
                  />
                  <Field
                    label="Bank Name"
                    required
                    placeholder="e.g. SBI / HDFC / ICICI"
                    value={f.bankName}
                    onChange={upd("bankName")}
                    err={errs.bankName}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="UPI ID"
                      placeholder="e.g. name@upi or 9876543210@paytm"
                      value={f.upiId}
                      onChange={upd("upiId")}
                    />
                  </div>
                </div>

                <FileField
                  label="UPI QR Code — For receiving payments"
                  file={files.upiQrImage}
                  {...us.upiQrImage}
                  uploadErr={us.upiQrImage.error}
                  onChange={(e) => onFile("upiQrImage", e)}
                />

                {/* Commission info — mobile only */}
                <div className="lg:hidden border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-3">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    Commission Structure
                  </p>
                  {[
                    ["Base Commission", "7% per delivery"],
                    ["Monthly Bonus", "₹400 on 100+ deliveries"],
                    ["Payout Schedule", "Every Monday"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">{k}</span>
                      <span className="text-teal-600 text-xs font-semibold">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                {srvErr && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-5 py-3">
                    {srvErr}
                  </div>
                )}
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200">
              {step > 1 ? (
                <button
                  onClick={back}
                  className="text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>
              ) : (
                <Link
                  to="/delivery/login"
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Login
                </Link>
              )}

              {step < 3 ? (
                <button
                  onClick={next}
                  disabled={anyUploading}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  {anyUploading ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Uploading…
                    </>
                  ) : (
                    <>
                      Continue
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={loading || anyUploading}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Submitting…
                    </>
                  ) : anyUploading ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Uploading docs…
                    </>
                  ) : (
                    <>
                      Submit Application
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-center text-slate-400 text-xs mt-6">
              Already registered?{" "}
              <Link
                to="/delivery/login"
                className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-8 py-4 flex items-center justify-between">
          <p className="text-slate-400 text-xs">
            All access is logged and monitored
          </p>
          <p className="text-slate-400 text-xs">support@bioburgpharma.com</p>
        </div>
      </div>
    </div>
  );
}
