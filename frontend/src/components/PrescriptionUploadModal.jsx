import React, { useState, useRef } from "react";
import axios from "axios";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, TextField, CircularProgress,
  Alert, Stepper, Step, StepLabel, IconButton, Divider,
} from "@mui/material";
import {
  CloudUpload, CheckCircle, Close, Description,
  LocationOn, ArrowBack, ArrowForward,
} from "@mui/icons-material";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const STEPS = ["Upload Prescription", "Delivery Address", "Confirm & Submit"];

export default function PrescriptionUploadModal({ open, onClose, product, qty = 1, variant = null }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [address, setAddress] = useState({
    fullName: "", phone: "", addressLine: "", city: "", state: "", pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const resetAll = () => {
    setStep(0); setFile(null); setFilePreview(null); setFileBase64(null);
    setAddress({ fullName: "", phone: "", addressLine: "", city: "", state: "", pincode: "" });
    setLoading(false); setSuccess(false); setOrderId(null);
  };

  const handleClose = () => { resetAll(); onClose(); };

  // ── File Selection ─────────────────────────────────────────────────────────
  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowed.includes(selectedFile.type)) {
      toast.error("Only JPG, PNG, or PDF files are allowed.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB.");
      return;
    }

    setFile(selectedFile);

    // Preview
    if (selectedFile.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(selectedFile));
    } else {
      setFilePreview("pdf");
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => setFileBase64(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const canNextStep1 = !!fileBase64;
  const canNextStep2 =
    address.fullName && address.phone && address.addressLine &&
    address.city && address.state && address.pincode;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const price = variant?.price || product?.ptr || product?.hpsr || product?.mrp || 0;

      const res = await axios.post(
        `${BASE_API}/api/user/upload-prescription`,
        {
          fileBase64,
          productId: product?._id,
          productName: product?.brandName,
          price,
          quantity: qty,
          address,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrderId(res.data.order?._id);
      setSuccess(true);
      toast.success("Prescription uploaded! We'll review it shortly.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sellingPrice = variant?.price || product?.ptr || product?.hpsr || product?.mrp || 0;

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: "center", py: 5, px: 4 }}>
          <CheckCircle sx={{ fontSize: 64, color: "#4caf50", mb: 2 }} />
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Prescription Uploaded!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Our pharmacist will review your prescription within <strong>2–4 hours</strong>. You'll receive an email once approved.
          </Typography>
          {orderId && (
            <Box sx={{ bgcolor: "#f3e5f5", borderRadius: 2, p: 2, mb: 3 }}>
              <Typography fontSize={12} color="text.secondary">Order ID</Typography>
              <Typography fontWeight={700} color="#7b1fa2" fontSize={16} letterSpacing={1}>
                #{orderId.slice(-8).toUpperCase()}
              </Typography>
            </Box>
          )}
          <Alert severity="info" sx={{ textAlign: "left", mb: 2, fontSize: 12 }}>
            📧 A confirmation email has been sent to your registered email address.
          </Alert>
          <Button variant="contained" fullWidth onClick={handleClose} sx={{ borderRadius: 2 }}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography fontWeight={700}>Upload Prescription</Typography>
            <Typography variant="caption" color="text.secondary">
              {product?.brandName} · ₹{sellingPrice} × {qty}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* Stepper */}
      <Box sx={{ px: 3, pt: 2.5 }}>
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel><Typography fontSize={11}>{label}</Typography></StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ pt: 3 }}>

        {/* ── STEP 0: Upload File ── */}
        {step === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Upload a clear photo or PDF of your doctor's prescription. It must be legible and issued by a licensed physician.
            </Typography>

            {/* Drop Zone */}
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${dragOver ? "#1976d2" : fileBase64 ? "#4caf50" : "#b0bec5"}`,
                borderRadius: 3, p: 4, textAlign: "center", cursor: "pointer",
                bgcolor: dragOver ? "#e3f2fd" : fileBase64 ? "#f1f8e9" : "#fafafa",
                transition: "all 0.2s",
                "&:hover": { borderColor: "#1976d2", bgcolor: "#e3f2fd" },
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />

              {filePreview && filePreview !== "pdf" ? (
                <Box>
                  <img src={filePreview} alt="Prescription preview"
                    style={{ maxHeight: 180, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />
                  <Typography fontSize={12} color="success.main" mt={1} fontWeight={600}>
                    ✓ {file?.name}
                  </Typography>
                </Box>
              ) : filePreview === "pdf" ? (
                <Box>
                  <Description sx={{ fontSize: 48, color: "#f44336", mb: 1 }} />
                  <Typography fontSize={13} fontWeight={600} color="success.main">✓ {file?.name}</Typography>
                  <Typography fontSize={11} color="text.secondary">PDF ready to upload</Typography>
                </Box>
              ) : (
                <Box>
                  <CloudUpload sx={{ fontSize: 48, color: "#90a4ae", mb: 1 }} />
                  <Typography fontWeight={600} color="text.secondary">
                    Drag & drop or click to upload
                  </Typography>
                  <Typography fontSize={12} color="text.secondary" mt={0.5}>
                    Supported: JPG, PNG, PDF · Max 5MB
                  </Typography>
                </Box>
              )}
            </Box>

            {fileBase64 && (
              <Button
                size="small"
                color="error"
                onClick={() => { setFile(null); setFilePreview(null); setFileBase64(null); }}
                sx={{ mt: 1, textTransform: "none" }}
              >
                Remove file
              </Button>
            )}

            <Alert severity="warning" sx={{ mt: 2, fontSize: 12 }}>
              ⚠️ The prescription must be issued by a registered medical practitioner and be less than 6 months old.
            </Alert>
          </Box>
        )}

        {/* ── STEP 1: Address ── */}
        {step === 1 && (
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <LocationOn color="primary" />
              <Typography fontWeight={600}>Delivery Address</Typography>
            </Box>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField label="Full Name *" value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                size="small" fullWidth />
              <TextField label="Phone *" value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                size="small" fullWidth inputProps={{ maxLength: 10 }} />
              <TextField label="Address Line *" value={address.addressLine}
                onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                size="small" fullWidth sx={{ gridColumn: "1 / -1" }} />
              <TextField label="City *" value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                size="small" fullWidth />
              <TextField label="State *" value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                size="small" fullWidth />
              <TextField label="Pincode *" value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                size="small" fullWidth inputProps={{ maxLength: 6 }} />
            </Box>
          </Box>
        )}

        {/* ── STEP 2: Confirm ── */}
        {step === 2 && (
          <Box>
            <Typography fontWeight={600} mb={2}>Order Summary</Typography>

            {/* Product */}
            <Box sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 2, mb: 2, border: "1px solid #e2e8f0" }}>
              <Typography fontSize={13} fontWeight={700}>{product?.brandName}</Typography>
              <Typography fontSize={12} color="text.secondary">Qty: {qty} · ₹{sellingPrice} each</Typography>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography fontSize={13}>Total</Typography>
                <Typography fontSize={13} fontWeight={700}>₹{(sellingPrice * qty).toLocaleString()}</Typography>
              </Box>
            </Box>

            {/* Prescription */}
            <Box sx={{ bgcolor: "#f3e5f5", borderRadius: 2, p: 2, mb: 2, border: "1px solid #ce93d8" }}>
              <Typography fontSize={12} fontWeight={700} color="#7b1fa2" mb={0.5}>📋 Prescription</Typography>
              <Typography fontSize={12} color="text.secondary">{file?.name}</Typography>
            </Box>

            {/* Address */}
            <Box sx={{ bgcolor: "#e3f2fd", borderRadius: 2, p: 2, mb: 2, border: "1px solid #90caf9" }}>
              <Typography fontSize={12} fontWeight={700} color="#1565c0" mb={0.5}>📍 Delivery Address</Typography>
              <Typography fontSize={12} color="text.secondary" lineHeight={1.8}>
                {address.fullName}<br />
                {address.addressLine}, {address.city}, {address.state} – {address.pincode}<br />
                 {address.phone}
              </Typography>
            </Box>

            <Alert severity="info" sx={{ fontSize: 12 }}>
              📧 You'll receive an email confirmation after uploading. Our pharmacist will review and approve within <strong>2–4 hours</strong>.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {step > 0 && (
          <Button startIcon={<ArrowBack />} onClick={() => setStep(step - 1)} disabled={loading}
            sx={{ textTransform: "none" }}>
            Back
          </Button>
        )}
        <Box flex={1} />
        {step < 2 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            disabled={step === 0 ? !canNextStep1 : !canNextStep2}
            onClick={() => setStep(step + 1)}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <CloudUpload />}
            sx={{ textTransform: "none", borderRadius: 2, minWidth: 180 }}
          >
            {loading ? "Uploading..." : "Submit & Upload"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}