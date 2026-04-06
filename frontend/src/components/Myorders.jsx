import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Typography, Paper, Chip, CircularProgress,
  Button, Divider, Avatar,
} from "@mui/material";
import {
  Receipt, KeyboardArrowDown, KeyboardArrowUp, Download,
} from "@mui/icons-material";
import InvoiceModal from "../components/Invoicemodal";

const BASE_API = import.meta.env.VITE_API_BASE_URL + "/api";

const STATUS_STEPS = ["Placed","Confirmed","Processing","Shipped","Out for Delivery","Delivered"];

const STATUS_COLORS = {
  Placed:            { bg: "#eff6ff", color: "#3b82f6" },
  Confirmed:         { bg: "#f0fdf4", color: "#16a34a" },
  Processing:        { bg: "#fff7ed", color: "#ea580c" },
  Shipped:           { bg: "#faf5ff", color: "#7c3aed" },
  "Out for Delivery":{ bg: "#ecfeff", color: "#0891b2" },
  Delivered:         { bg: "#f0fdf4", color: "#15803d" },
  Cancelled:         { bg: "#fef2f2", color: "#dc2626" },
};

function StatusChip({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["Placed"];
  return (
    <Chip label={status} size="small"
      sx={{ fontWeight: 700, fontSize: 11, bgcolor: c.bg, color: c.color }} />
  );
}

function OrderProgress({ status }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <Box sx={{ display: "flex", alignItems: "center", mt: 1.5, mb: 1 }}>
      {STATUS_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              bgcolor: i < idx ? "#16a34a" : i === idx ? "#3b82f6" : "#e2e8f0",
              color: i <= idx ? "white" : "#94a3b8",
              fontWeight: 700, fontSize: 11,
            }}>
              {i < idx ? "✓" : i + 1}
            </Box>
            <Typography sx={{ fontSize: 9, mt: 0.5, color: i <= idx ? "#1e293b" : "#94a3b8",
              fontWeight: i === idx ? 700 : 400, textAlign: "center", lineHeight: 1.2 }}>
              {step}
            </Typography>
          </Box>
          {i < STATUS_STEPS.length - 1 && (
            <Box sx={{ flex: 1, height: 2, bgcolor: i < idx ? "#16a34a" : "#e2e8f0", mb: 2.5 }} />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}

function OrderCard({ order }) {
  const [expanded, setExpanded]         = useState(false);
  const [invoiceOpen, setInvoiceOpen]   = useState(false);

  const canDownloadInvoice = order.invoiceReady === true;

  return (
    <>
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, mb: 2.5, overflow: "hidden" }}>

        {/* ── Order Header ── */}
        <Box
          onClick={() => setExpanded(!expanded)}
          sx={{
            p: 2.5, cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 1.5,
            "&:hover": { bgcolor: "#f8fafc" },
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: "#eff6ff", color: "#3b82f6", width: 42, height: 42 }}>
              <Receipt />
            </Avatar>
            <Box>
              <Typography fontWeight={700} fontSize={15}>
                Order #{order._id?.slice(-8).toUpperCase()}
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : "—"}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1.5}>
            <StatusChip status={order.orderStatus} />
            <Typography fontWeight={800} fontSize={16}>₹{order.totalAmount?.toFixed(2)}</Typography>
            {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </Box>
        </Box>

        {/* ── Expanded Content ── */}
        {expanded && (
          <>
            <Divider />
            <Box p={2.5}>

              {/* Progress */}
              <OrderProgress status={order.orderStatus} />

              <Divider sx={{ my: 2 }} />

              {/* Items */}
              <Typography fontWeight={700} fontSize={13} mb={1.5} sx={{ textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b" }}>
                Items
              </Typography>
              {(order.items || []).map((item, i) => {
                const name  = item.productId?.brandName || item.productId?.title || item.name || "Product";
                const img   = item.productId?.images?.[0]?.url || "/no-image.png";
                const price = item.priceAtAdded || item.price || 0;
                return (
                  <Box key={i} display="flex" alignItems="center" gap={2}
                    sx={{ mb: 1.5, pb: 1.5, borderBottom: i < order.items.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <Box component="img" src={img} alt={name}
                      onError={(e) => { e.target.src = "/no-image.png" }}
                      sx={{ width: 52, height: 52, borderRadius: 2, objectFit: "cover", border: "1px solid #e2e8f0" }} />
                    <Box flex={1}>
                      <Typography fontWeight={600} fontSize={14}>{name}</Typography>
                      <Typography fontSize={12} color="text.secondary">Qty: {item.quantity}</Typography>
                    </Box>
                    <Typography fontWeight={700} fontSize={14}>₹{(price * item.quantity).toFixed(2)}</Typography>
                  </Box>
                );
              })}

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={700} fontSize={15}>Total</Typography>
                <Typography fontWeight={800} fontSize={17}>₹{order.totalAmount?.toFixed(2)}</Typography>
              </Box>

              {/* Tracking */}
              {order.orderStatusHistory?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography fontWeight={700} fontSize={13} mb={1.5} sx={{ textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b" }}>
                    Tracking History
                  </Typography>
                  {order.orderStatusHistory.map((h, i) => (
                    <Box key={i} display="flex" alignItems="flex-start" gap={1.5} mb={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#3b82f6", mt: 0.7, flexShrink: 0 }} />
                      <Box>
                        <Typography fontSize={13} fontWeight={600}>{h.status}</Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {h.timestamp ? new Date(h.timestamp).toLocaleString("en-IN") : ""}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </>
              )}

              {/* Invoice Download */}
              <Divider sx={{ my: 2 }} />
              {canDownloadInvoice ? (
                <Button
                  fullWidth variant="contained"
                  startIcon={<Download />}
                  onClick={() => setInvoiceOpen(true)}
                  sx={{
                    bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" },
                    borderRadius: 2, textTransform: "none", fontWeight: 600,
                  }}
                >
                  Download Invoice (PDF)
                </Button>
              ) : (
                <Box sx={{ bgcolor: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: 2,
                  p: 2, textAlign: "center" }}>
                  <Receipt sx={{ color: "#cbd5e1", fontSize: 28, mb: 0.5 }} />
                  <Typography fontSize={13} color="text.secondary" fontWeight={600}>
                    Invoice will be available once your order is confirmed for processing
                  </Typography>
                </Box>
              )}

            </Box>
          </>
        )}
      </Paper>

      <InvoiceModal
        open={invoiceOpen}
        order={order}
        onClose={() => setInvoiceOpen(false)}
      />
    </>
  );
}

/* ── MAIN EXPORT ── */
export default function MyOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("All");

  const filters = ["All","Placed","Confirmed","Processing","Shipped","Delivered","Cancelled"];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res   = await axios.get(`${BASE_API}/orders/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data.orders || res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = filter === "All" ? orders : orders.filter(o => o.orderStatus === filter);

  const countOf = (s) => orders.filter(o => o.orderStatus === s).length;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} mb={0.5}>My Orders</Typography>
      <Typography fontSize={13} color="text.secondary" mb={3}>{orders.length} orders</Typography>

      {/* Filter tabs */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        {filters.map((f) => (
          <Chip key={f}
            label={`${f}${f !== "All" && countOf(f) > 0 ? ` (${countOf(f)})` : ""}`}
            onClick={() => setFilter(f)}
            sx={{
              fontWeight: 600, cursor: "pointer",
              bgcolor: filter === f ? "#1e293b" : "#f1f5f9",
              color:   filter === f ? "white"   : "#475569",
              "&:hover": { bgcolor: filter === f ? "#0f172a" : "#e2e8f0" },
            }}
          />
        ))}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 3 }}>
          <Typography fontSize={40} mb={1}>📦</Typography>
          <Typography fontWeight={700} mb={0.5}>No orders found</Typography>
          <Typography fontSize={13} color="text.secondary">
            {filter === "All" ? "You haven't placed any orders yet." : `No ${filter} orders.`}
          </Typography>
        </Paper>
      ) : (
        filtered.map(order => <OrderCard key={order._id} order={order} />)
      )}
    </Box>
  );
}