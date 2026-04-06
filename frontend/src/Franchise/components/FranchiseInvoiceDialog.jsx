import React, { useRef } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ConsoleButton } from "./consoleUi";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) =>
  new Date(value || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const buildInvoiceNumber = (order) =>
  order?.invoiceNumber ||
  `BB/FR/${new Date(order?.createdAt || Date.now()).getFullYear()}/${String(order?._id || "")
    .slice(-8)
    .toUpperCase()}`;

const getProductName = (item) =>
  item?.name ||
  item?.productId?.brandName ||
  item?.productId?.genericName ||
  "Product";

export default function FranchiseInvoiceDialog({ open, onClose, order }) {
  const printableRef = useRef(null);

  if (!order) {
    return null;
  }

  const invoiceNumber = buildInvoiceNumber(order);
  const address = order.address || {};
  const grandTotal = Number(order.totalAmount || 0);
  const orderItems = order.items || [];

  const handlePrint = () => {
    if (!printableRef.current) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=700");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
            h1, h2, h3, p { margin: 0; }
            .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
            .brand { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
            .muted { color: #64748b; font-size: 12px; line-height: 1.6; }
            .panel { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; font-size: 12px; text-align: left; }
            th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }
            .right { text-align: right; }
            .total { font-size: 18px; font-weight: 700; }
            .footer { margin-top: 24px; color: #64748b; font-size: 11px; }
          </style>
        </head>
        <body>${printableRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <Dialog
      className="franchise-console-dialog"
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle sx={{ color: "#fff", fontFamily: "'IBM Plex Mono', monospace" }}>
        Printable Invoice
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "#0b0d11" }}>
        <Box
          ref={printableRef}
          sx={{
            bgcolor: "#111318",
            p: 4,
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 3,
              flexWrap: "wrap",
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={800}>
                BioBurg Franchise
              </Typography>
              <Typography sx={{ mt: 1, color: "#94a3b8" }}>
                Tax invoice for franchise-managed order fulfilment.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "#64748b" }}>
                support@bioburgpharma.com
              </Typography>
            </Box>

            <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Invoice Number
              </Typography>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ color: "#fbbf24", fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {invoiceNumber}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "#94a3b8" }}>
                Order #{String(order._id || "").slice(-8).toUpperCase()}
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                Date {formatDate(order.createdAt)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              mb: 3,
            }}
          >
            <Box
              sx={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 3,
                p: 2.5,
                bgcolor: "rgba(255,255,255,0.02)",
              }}
            >
              <Typography variant="overline" sx={{ color: "#64748b" }}>
                Bill To
              </Typography>
              <Typography fontWeight={700} sx={{ color: "#fff" }}>
                {address.fullName || "Customer"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: "#94a3b8" }}>
                {address.addressLine || "-"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                {[address.city, address.state].filter(Boolean).join(", ") || "-"}
                {address.pincode ? ` - ${address.pincode}` : ""}
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                {address.phone || order.userId?.phone || "-"}
              </Typography>
            </Box>

            <Box
              sx={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 3,
                p: 2.5,
                bgcolor: "rgba(255,255,255,0.02)",
              }}
            >
              <Typography variant="overline" sx={{ color: "#64748b" }}>
                Order Summary
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Customer
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#fff" }}>
                    {order.userId?.name || address.fullName || "-"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Payment
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#fff" }}>
                    {order.paymentMode || "-"} / {order.paymentStatus || "-"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Order Status
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#fff" }}>
                    {order.orderStatus || "-"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Items
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#fff" }}>
                    {orderItems.length}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "#64748b", borderColor: "rgba(255,255,255,0.06)" }}>#</TableCell>
                <TableCell sx={{ color: "#64748b", borderColor: "rgba(255,255,255,0.06)" }}>Product</TableCell>
                <TableCell sx={{ color: "#64748b", borderColor: "rgba(255,255,255,0.06)" }}>Batch</TableCell>
                <TableCell sx={{ color: "#64748b", borderColor: "rgba(255,255,255,0.06)" }}>HSN</TableCell>
                <TableCell align="right" sx={{ color: "#64748b", borderColor: "rgba(255,255,255,0.06)" }}>Qty</TableCell>
                <TableCell align="right" sx={{ color: "#64748b", borderColor: "rgba(255,255,255,0.06)" }}>Price</TableCell>
                <TableCell align="right" sx={{ color: "#64748b", borderColor: "rgba(255,255,255,0.06)" }}>Line Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderItems.map((item, index) => {
                const quantity = Number(item.quantity || 0);
                const price = Number(item.priceAtAdded ?? item.price ?? 0);

                return (
                  <TableRow key={`${item.productId?._id || item.name || "item"}-${index}`}>
                    <TableCell sx={{ color: "#e2e8f0", borderColor: "rgba(255,255,255,0.05)" }}>{index + 1}</TableCell>
                    <TableCell sx={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <Typography fontWeight={600} sx={{ color: "#fff" }}>{getProductName(item)}</Typography>
                      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                        {item.productId?.manufacturer || item.manufacturer || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "#cbd5e1", borderColor: "rgba(255,255,255,0.05)" }}>{item.batchNumber || item.productId?.batchNumber || "-"}</TableCell>
                    <TableCell sx={{ color: "#cbd5e1", borderColor: "rgba(255,255,255,0.05)" }}>{item.hsn || item.productId?.hsn || "-"}</TableCell>
                    <TableCell align="right" sx={{ color: "#e2e8f0", borderColor: "rgba(255,255,255,0.05)" }}>{quantity}</TableCell>
                    <TableCell align="right" sx={{ color: "#e2e8f0", borderColor: "rgba(255,255,255,0.05)" }}>{formatCurrency(price)}</TableCell>
                    <TableCell align="right" sx={{ color: "#fbbf24", borderColor: "rgba(255,255,255,0.05)", fontWeight: 700 }}>{formatCurrency(quantity * price)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ width: { xs: "100%", sm: 320 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ color: "#64748b" }}>Order Total</Typography>
                  <Typography fontWeight={600} sx={{ color: "#fff" }}>{formatCurrency(grandTotal)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ color: "#64748b" }}>Delivery Charge</Typography>
                  <Typography fontWeight={600} sx={{ color: "#fff" }}>{formatCurrency(order.deliveryCharge || 0)}</Typography>
                </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ color: "#64748b" }}>Discount</Typography>
                <Typography fontWeight={600} sx={{ color: "#fff" }}>{formatCurrency(order.discountAmount || 0)}</Typography>
              </Box>
              <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#fff" }}>
                  Grand Total
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ color: "#fbbf24", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {formatCurrency(grandTotal)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Typography variant="caption" sx={{ display: "block", mt: 4, color: "#64748b" }}>
            Computer generated invoice for franchise operations. Keep this copy for reconciliation, delivery handover, and payout records.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <ConsoleButton variant="secondary" onClick={onClose}>
          Close
        </ConsoleButton>
        <ConsoleButton onClick={handlePrint}>
          Print / Save PDF
        </ConsoleButton>
      </DialogActions>
    </Dialog>
  );
}
