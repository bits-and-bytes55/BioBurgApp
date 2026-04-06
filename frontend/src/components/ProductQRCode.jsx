// src/components/ProductQRCode.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Box, Typography, Button, Paper, Tooltip, Chip, Divider,
  IconButton, Dialog, DialogContent, DialogTitle,
} from "@mui/material";
import {
  Download as DownloadIcon,
  QrCode2 as QrCode2Icon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";


const FRONTEND_BASE = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.host.replace("8000", "5173")}`
  : "http://localhost:5173";

let qrLib = null;
let qrLibLoading = false;
const qrLibCallbacks = [];

function loadQrLib() {
  return new Promise((resolve) => {
    if (qrLib) { resolve(qrLib); return; }
    qrLibCallbacks.push(resolve);
    if (qrLibLoading) return;
    qrLibLoading = true;

    const script = document.createElement("script");
    // qrcode-generator — tiny, zero-dependency, CDN-hosted
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload = () => {
      // After QRCode.js loads, wrap it
      qrLib = window.QRCode;
      qrLibCallbacks.forEach(cb => cb(qrLib));
      qrLibCallbacks.length = 0;
    };
    script.onerror = () => {
      // Fallback: use a different CDN
      const s2 = document.createElement("script");
      s2.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";
      s2.onload = () => {
        qrLib = window.qrcode;
        qrLibCallbacks.forEach(cb => cb(qrLib));
        qrLibCallbacks.length = 0;
      };
      document.head.appendChild(s2);
    };
    document.head.appendChild(script);
  });
}

// ── QR Canvas renderer ─────────────────────────────────────────────────────
function QRCanvas({ value, size = 200, color = "#1565c0", bgColor = "#ffffff" }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value || !containerRef.current) return;
    containerRef.current.innerHTML = "";

    // Create a hidden div for QRCode.js to render into
    const hiddenDiv = document.createElement("div");
    hiddenDiv.style.position = "absolute";
    hiddenDiv.style.opacity = "0";
    hiddenDiv.style.pointerEvents = "none";
    document.body.appendChild(hiddenDiv);

    const render = async () => {
      try {
        await loadQrLib();

        new window.QRCode(hiddenDiv, {
          text: value,
          width: size,
          height: size,
          colorDark: color,
          colorLight: bgColor,
          correctLevel: window.QRCode.CorrectLevel.H,
        });

        // Wait for QRCode.js to finish rendering
        setTimeout(() => {
          const srcCanvas = hiddenDiv.querySelector("canvas");
          const srcImg    = hiddenDiv.querySelector("img");

          const canvas  = document.createElement("canvas");
          const padding = 18;
          const textH   = 28;
          canvas.width  = size + padding * 2;
          canvas.height = size + padding * 2 + textH;
          const ctx = canvas.getContext("2d");

          // Background
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(0, 0, canvas.width, canvas.height, 12);
          ctx.fill();

          // Diagonal watermark text behind QR
          ctx.save();
          ctx.globalAlpha = 0.07;
          ctx.font = "bold 22px Arial";
          ctx.fillStyle = "#1565c0";
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 6);
          const step = 44;
          for (let y = -canvas.height; y < canvas.height; y += step) {
            for (let x = -canvas.width; x < canvas.width; x += 130) {
              ctx.fillText("BioBurg", x, y);
            }
          }
          ctx.restore();

          // Draw the QR code on top
          const drawQR = (source) => {
            ctx.drawImage(source, padding, padding, size, size);

            // Bottom brand bar
            ctx.fillStyle = "#1565c0";
            ctx.beginPath();
            ctx.roundRect(0, size + padding * 2, canvas.width, textH, [0, 0, 12, 12]);
            ctx.fill();

            // "BioBurg" text in bar
            ctx.fillStyle = "#ffffff";
            ctx.font      = "bold 13px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("BioBurg", canvas.width / 2 - 18, size + padding * 2 + textH / 2);

            // Small logo dot accent
            ctx.fillStyle = "#93c5fd";
            ctx.beginPath();
            ctx.arc(canvas.width / 2 + 34, size + padding * 2 + textH / 2, 4, 0, Math.PI * 2);
            ctx.fill();

            // Append to container
            if (containerRef.current) {
              containerRef.current.innerHTML = "";
              canvas.style.borderRadius = "12px";
              canvas.style.display = "block";
              containerRef.current.appendChild(canvas);
            }
            document.body.removeChild(hiddenDiv);
            setError(false);
          };

          if (srcCanvas) {
            drawQR(srcCanvas);
          } else if (srcImg) {
            if (srcImg.complete) {
              drawQR(srcImg);
            } else {
              srcImg.onload = () => drawQR(srcImg);
            }
          }
        }, 100);
      } catch (e) {
        console.error("QR render error:", e);
        document.body.removeChild(hiddenDiv);
        setError(true);
      }
    };

    render();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (containerRef.current) containerRef.current.innerHTML = "";
      if (document.body.contains(hiddenDiv)) document.body.removeChild(hiddenDiv);
    };
  }, [value, size, color, bgColor]);

  if (error) {
    return (
      <Box
        sx={{ width: size, height: size, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", bgcolor: "#f0f0f0",
          borderRadius: 2, gap: 1, border: "2px dashed #ccc" }}
      >
        <QrCode2Icon sx={{ fontSize: 40, color: "#9ca3af" }} />
        <Typography variant="caption" color="text.secondary" textAlign="center">
          QR unavailable
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        width: size + 36,
        height: size + 36 + 28,
        "& canvas": { borderRadius: "12px", boxShadow: "0 2px 12px rgba(21,101,192,0.15)" },
      }}
    />
  );
}

// ── Download helper ────────────────────────────────────────────────────────
function downloadQR(containerRef, filename = "product-qr.png") {
  if (!containerRef.current) return;
  const canvas = containerRef.current.querySelector("canvas");
  const img = containerRef.current.querySelector("img");

  if (canvas) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } else if (img) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = img.src;
    link.click();
  }
}

export default function ProductQRCode({ product, compact = false, productUrl }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef(null);
  const largeQrRef = useRef(null);

  if (!product?._id && !product?.brandName) return null;

  const url = productUrl || `${FRONTEND_BASE}/product-details/${product._id}`;

  const expiryDisplay = product.expiryDate
    ? new Date(product.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "N/A";

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (ref, size) => {
    const name = `${(product.brandName || "product").replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    downloadQR(ref || qrContainerRef, name);
  };

  // ── COMPACT mode — small badge for product table ──────────────────────
  if (compact) {
    return (
      <>
        <Tooltip title={`View QR — ${product.brandName}`} arrow>
          <Box
            onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1.5,
              border: "1px solid #bfdbfe",
              bgcolor: "#eff6ff",
              cursor: "pointer",
              "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd" },
              transition: "all .15s",
            }}
          >
            <QrCode2Icon sx={{ fontSize: 16, color: "#1565c0" }} />
            <Typography variant="caption" color="#1565c0" fontWeight={600}>
              QR
            </Typography>
          </Box>
        </Tooltip>

        {/* Full QR dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          onClick={(e) => e.stopPropagation()}
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6", pb: 1.5 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <QrCode2Icon color="primary" />
              <Typography fontWeight={700}>Product QR Code</Typography>
            </Box>
            <IconButton size="small" onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <QRCodeCard
              product={product}
              url={url}
              expiryDisplay={expiryDisplay}
              onDownload={() => handleDownload(largeQrRef)}
              onCopy={handleCopyUrl}
              copied={copied}
              qrRef={largeQrRef}
              size={220}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── FULL mode — shown in add/edit forms ───────────────────────────────
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 3, border: "1.5px solid #e0e7ff", overflow: "hidden" }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          background: "linear-gradient(135deg,#1565c0,#1e40af)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <QrCode2Icon sx={{ color: "white", fontSize: 22 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="white">
              Product QR Code
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
              Scan to open product page
            </Typography>
          </Box>
        </Box>
        <Chip
          label="Auto-generated"
          size="small"
          sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontSize: 10 }}
        />
      </Box>

      <Box sx={{ p: 2.5 }}>
        <QRCodeCard
          product={product}
          url={url}
          expiryDisplay={expiryDisplay}
          onDownload={() => handleDownload(qrContainerRef)}
          onCopy={handleCopyUrl}
          copied={copied}
          qrRef={qrContainerRef}
          size={200}
        />
      </Box>
    </Paper>
  );
}

// ── Shared card content ────────────────────────────────────────────────────
function QRCodeCard({ product, url, expiryDisplay, onDownload, onCopy, copied, qrRef, size }) {
  return (
    <Box>
      <Box display="flex" gap={2.5} alignItems="flex-start" flexWrap="wrap">
        {/* QR image */}
        {/* QR image */}
<Box sx={{ flexShrink: 0 }}>
  <Box ref={qrRef} sx={{ display: "inline-block" }}>
    <QRCanvas value={url} size={size} color="#1565c0" bgColor="#ffffff" />
  </Box>
  <Button
    fullWidth
    variant="contained"
    size="small"
    startIcon={<DownloadIcon />}
    onClick={onDownload}
    sx={{
      mt: 1,
      borderRadius: 2,
      background: "linear-gradient(135deg,#1565c0,#1e40af)",
      fontWeight: 700,
      fontSize: 12,
    }}
  >
    Download PNG
  </Button>
</Box>

        {/* Product info */}
        <Box flex={1} minWidth={160}>
          <Typography variant="subtitle2" fontWeight={700} color="#111827" mb={1.5}>
            Encoded Information
          </Typography>

          <Stack spacing={1}>
            {[
              { label: "Product", value: product.brandName || "—" },
              { label: "Manufacturer", value: product.manufacturer || "—" },
              { label: "MRP", value: product.mrp ? `₹${product.mrp}` : "—" },
              { label: "Expiry", value: expiryDisplay },
              { label: "Batch", value: product.batchNumber || "—" },
              { label: "GST", value: product.gst_igst ? `${product.gst_igst}%` : "—" },
            ].map(({ label, value }) => (
              <Box key={label} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {label}
                </Typography>
                <Typography variant="caption" fontWeight={700} color="#374151"
                  sx={{ maxWidth: 140, textAlign: "right", wordBreak: "break-all" }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {/* URL display */}
          <Box
            sx={{
              bgcolor: "#f8fafc",
              borderRadius: 1.5,
              p: 1,
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              color="#64748b"
              sx={{ flex: 1, wordBreak: "break-all", fontSize: 10, lineHeight: 1.4 }}
            >
              {url}
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5} flexShrink={0}>
              <Tooltip title={copied ? "Copied!" : "Copy URL"} arrow>
                <IconButton size="small" onClick={onCopy} sx={{ p: 0.5 }}>
                  <CopyIcon sx={{ fontSize: 14, color: copied ? "#16a34a" : "#9ca3af" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Open in new tab" arrow>
                <IconButton size="small" onClick={() => window.open(url, "_blank")} sx={{ p: 0.5 }}>
                  <OpenInNewIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// Missing Stack import helper
function Stack({ children, spacing = 1, ...props }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: spacing }} {...props}>
      {children}
    </Box>
  );
}