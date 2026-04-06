import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  IconButton, Avatar, Button, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Dialog,
  DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
  Tooltip, Divider, LinearProgress, Step, StepLabel, Stepper,
} from "@mui/material";
import {
  Search, Refresh, Edit, ExpandMore, ExpandLess,
  LocalShipping, Receipt, CheckCircle, Cancel,
  PersonSearch, TwoWheeler, Storefront, Place,
} from "@mui/icons-material";
import InvoiceModal from "../../components/Invoicemodal";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const STATUS_STEPS = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const STATUS_COLORS  = {
  Placed:           { bg: "#eff6ff", color: "#3b82f6", border: "#bfdbfe" },
  Confirmed:        { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Processing:       { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  Shipped:          { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  "Out for Delivery":{ bg: "#ecfeff", color: "#0891b2", border: "#a5f3fc" },
  Delivered:        { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  Cancelled:        { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

function StatusChip({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["Placed"];
  return (
    <Chip label={status} size="small" sx={{
      fontWeight: 700, fontSize: 11,
      bgcolor: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
    }} />
  );
}

function OrderProgress({ status }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0, mt: 1 }}>
      {STATUS_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              bgcolor: i < idx ? "#16a34a" : i === idx ? "#3b82f6" : "#e2e8f0",
              color: i <= idx ? "white" : "#94a3b8",
              fontWeight: 700, fontSize: 13, border: i === idx ? "3px solid #bfdbfe" : "none",
              transition: "all 0.3s",
            }}>
              {i < idx ? <CheckCircle sx={{ fontSize: 18 }} /> : i + 1}
            </Box>
            <Typography sx={{ fontSize: 10, mt: 0.5, color: i <= idx ? "#1e293b" : "#94a3b8", fontWeight: i === idx ? 700 : 400, textAlign: "center", lineHeight: 1.2 }}>
              {step}
            </Typography>
          </Box>
          {i < STATUS_STEPS.length - 1 && (
            <Box sx={{ flex: 1, height: 2, bgcolor: i < idx ? "#16a34a" : "#e2e8f0", mb: 2.5, transition: "all 0.3s" }} />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}

/* ── Update Status Dialog ───────────────────────────────── */
function UpdateStatusDialog({ open, order, onClose, onUpdated }) {
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (order) setStatus(order.orderStatus || "Placed"); }, [order]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.patch(
        `${BASE_API}/api/orders/${order._id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdated(`Status updated to "${status}"${status === "Processing" ? " — Invoice sent to user!" : ""}`);
      onClose();
    } catch (e) {
      onUpdated(e.response?.data?.message || "Update failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <LocalShipping color="primary" />
        <Typography fontWeight={700}>Update Order Status</Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Typography fontSize={13} color="text.secondary" mb={2}>
          Order <strong>#{order._id?.slice(-8).toUpperCase()}</strong>
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>New Status</InputLabel>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} label="New Status">
            {[...STATUS_STEPS, "Cancelled"].map((s) => (
              <MenuItem key={s} value={s}>
                <Box display="flex" alignItems="center" gap={1}>
                  <StatusChip status={s} />
                  {s === "Processing" && (
                    <Typography fontSize={11} color="warning.main" fontWeight={600}>
                      📄 Releases invoice to user
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {status === "Processing" && (
          <Alert severity="info" sx={{ mt: 2, fontSize: 12 }}>
            Setting to <strong>Processing</strong> will make the invoice available for the customer to download.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <CheckCircle />}
          sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" }, textTransform: "none" }}>
          {loading ? "Saving…" : "Update Status"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Assign Agent Dialog ─────────────────────────────────── */
function AssignAgentDialog({ open, order, onClose, onAssigned }) {
  const [step,         setStep]         = useState(0);   // 0=Agent, 1=Type, 2=Location
  const [agents,       setAgents]       = useState([]);
  const [agentsLoading,setAgentsLoading]= useState(false);
  const [agentId,      setAgentId]      = useState("");
  const [orderType,    setOrderType]    = useState("");  // "pickup" | "delivery"
  const [location,     setLocation]     = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  /* Pre-fill delivery address when order is known */
  useEffect(() => {
    if (order?.address) {
      const a = order.address;
      setLocation([a.addressLine, a.city, a.state, a.pincode].filter(Boolean).join(", "));
    }
    setStep(0);
    setAgentId("");
    setOrderType("");
  }, [order]);

  /* Fetch available online agents */
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setAgentsLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const { data } = await axios.get(`${BASE_API}/api/delivery/admin/agents/online`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAgents((data.agents || []).filter(a => !a.currentOrder));
      } catch { setAgents([]); }
      finally { setAgentsLoading(false); }
    };
    load();
  }, [open]);

  const handleAssign = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("adminToken");
      const { data } = await axios.patch(`${BASE_API}/api/orders/${order._id}/assign-agent`,
        { agentId, orderType, location },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAssigned(data.message || "Order assigned to agent successfully!");
      onClose();
    } catch (e) {
      onAssigned(e.response?.data?.message || "Assignment failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(0); setAgentId(""); setOrderType(""); setLocation("");
    onClose();
  };

  const selectedAgent = agents.find(a => a._id === agentId);

  if (!order) return null;

  const STEPS = ["Select Agent", "Task Type", "Location"];

  const canNext =
    (step === 0 && agentId) ||
    (step === 1 && orderType) ||
    (step === 2 && location.trim());

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TwoWheeler sx={{ color: "#16a34a", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize={16}>Assign Delivery Agent</Typography>
            <Typography fontSize={12} color="text.secondary">
              Order #{order._id?.slice(-8).toUpperCase()}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* Stepper */}
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel sx={{ "& .MuiStepLabel-label": { fontSize: 12 } }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* ── Step 0: Select Agent ── */}
        {step === 0 && (
          <Box>
            <Typography fontSize={13} color="text.secondary" mb={2} fontWeight={500}>
              Choose an available online agent for this order.
            </Typography>

            {agentsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={28} />
              </Box>
            ) : agents.length === 0 ? (
              <Alert severity="warning" sx={{ fontSize: 13 }}>
                No agents are available online right now. Check back shortly.
              </Alert>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {agents.map(agent => (
                  <Box
                    key={agent._id}
                    onClick={() => setAgentId(agent._id)}
                    sx={{
                      border: `2px solid ${agentId === agent._id ? "#3b82f6" : "#e2e8f0"}`,
                      borderRadius: 2.5,
                      p: 2,
                      cursor: "pointer",
                      bgcolor: agentId === agent._id ? "#eff6ff" : "#fff",
                      transition: "all 0.18s",
                      "&:hover": { borderColor: "#93c5fd", bgcolor: "#f8fafc" },
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Avatar sx={{ bgcolor: agentId === agent._id ? "#3b82f6" : "#e0e7ff", color: agentId === agent._id ? "#fff" : "#4f46e5", fontWeight: 700 }}>
                      {agent.name?.[0]?.toUpperCase() || "A"}
                    </Avatar>
                    <Box flex={1}>
                      <Typography fontSize={13} fontWeight={700}>{agent.name}</Typography>
                      <Typography fontSize={11} color="text.secondary" fontFamily="monospace">{agent.agentId}</Typography>
                    </Box>
                    <Box textAlign="right">
                      <Chip
                        label="Available"
                        size="small"
                        sx={{ bgcolor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontWeight: 700, fontSize: 10 }}
                      />
                      <Typography fontSize={11} color="text.secondary" mt={0.5} textTransform="capitalize">
                        {agent.vehicleType || "Vehicle"}
                      </Typography>
                    </Box>
                    {agentId === agent._id && (
                      <CheckCircle sx={{ color: "#3b82f6", fontSize: 20 }} />
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* ── Step 1: Task Type ── */}
        {step === 1 && (
          <Box>
            <Typography fontSize={13} color="text.secondary" mb={2} fontWeight={500}>
              What should the agent do for this order?
            </Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              {[
                { key: "pickup",   label: "Pickup",   desc: "Agent collects item from store/seller",   icon: <Storefront sx={{ fontSize: 28 }} />, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                { key: "delivery", label: "Delivery", desc: "Agent delivers item to customer address",  icon: <LocalShipping sx={{ fontSize: 28 }} />, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
              ].map(t => (
                <Box
                  key={t.key}
                  onClick={() => setOrderType(t.key)}
                  sx={{
                    border: `2px solid ${orderType === t.key ? t.color : "#e2e8f0"}`,
                    borderRadius: 3,
                    p: 3,
                    cursor: "pointer",
                    bgcolor: orderType === t.key ? t.bg : "#fff",
                    textAlign: "center",
                    transition: "all 0.18s",
                    "&:hover": { borderColor: t.color, bgcolor: t.bg },
                    position: "relative",
                  }}
                >
                  {orderType === t.key && (
                    <CheckCircle sx={{ position: "absolute", top: 10, right: 10, color: t.color, fontSize: 18 }} />
                  )}
                  <Box sx={{ color: orderType === t.key ? t.color : "#94a3b8", mb: 1 }}>{t.icon}</Box>
                  <Typography fontSize={14} fontWeight={700} color={orderType === t.key ? t.color : "#1e293b"}>{t.label}</Typography>
                  <Typography fontSize={11} color="text.secondary" mt={0.5} lineHeight={1.4}>{t.desc}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ── Step 2: Location & Summary ── */}
        {step === 2 && (
          <Box>
            <Typography fontSize={13} color="text.secondary" mb={2} fontWeight={500}>
              Confirm the {orderType === "pickup" ? "pickup" : "delivery"} address for the agent.
            </Typography>
            <TextField
              fullWidth
              size="small"
              label={orderType === "pickup" ? "Pickup Location / Address" : "Delivery Location / Address"}
              value={location}
              onChange={e => setLocation(e.target.value)}
              multiline
              rows={2}
              InputProps={{ startAdornment: <InputAdornment position="start"><Place sx={{ color: "#94a3b8", fontSize: 18 }} /></InputAdornment> }}
              sx={{ mb: 3 }}
            />

            {/* Summary card */}
            <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5, p: 2.5 }}>
              <Typography fontSize={11} fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
                Assignment Summary
              </Typography>
              {[
                ["Agent",    selectedAgent ? `${selectedAgent.name} (${selectedAgent.agentId})` : "—"],
                ["Order ID", `#${order._id?.slice(-8).toUpperCase()}`],
                ["Task",     orderType === "pickup" ? "Pickup" : "Delivery"],
                ["Location", location || "—"],
                ["Customer", order.address?.fullName || "—"],
                ["Amount",   `₹${order.totalAmount?.toFixed(2) || "—"}`],
              ].map(([k, v]) => (
                <Box key={k} display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography fontSize={12} color="text.secondary">{k}</Typography>
                  <Typography fontSize={12} fontWeight={600} textAlign="right" maxWidth="60%" sx={{ wordBreak: "break-word" }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        {step > 0
          ? <Button onClick={() => setStep(s => s - 1)} disabled={submitting} sx={{ textTransform: "none" }}>Back</Button>
          : <Button onClick={handleClose} disabled={submitting} sx={{ textTransform: "none" }}>Cancel</Button>
        }
        {step < 2 ? (
          <Button
            variant="contained"
            disabled={!canNext}
            onClick={() => setStep(s => s + 1)}
            sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" }, textTransform: "none", fontWeight: 600 }}
          >
            Continue →
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={!location.trim() || submitting}
            onClick={handleAssign}
            startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <TwoWheeler />}
            sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" }, textTransform: "none", fontWeight: 600 }}
          >
            {submitting ? "Assigning…" : "Confirm & Assign"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/* ── Expanded Order Detail Row ─────────────────────────── */
function OrderDetailRow({ order, onEdit, onInvoice, onAssign }) {
  return (
    <Box sx={{ bgcolor: "#f8fafc", px: 4, py: 3, borderBottom: "1px solid #e2e8f0" }}>

      {/* Progress bar */}
      <Box mb={3}>
        <Typography fontWeight={700} fontSize={13} mb={1.5}>Order Progress</Typography>
        <OrderProgress status={order.orderStatus} />
      </Box>

      <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr 1fr" }} gap={3}>

        {/* Items */}
        <Box>
          <Typography fontWeight={700} fontSize={13} mb={1.5}>Order Items</Typography>
          <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 2, border: "1px solid #e2e8f0" }}>
            {(order.items || []).map((item, i) => {
              const name  = item.productId?.brandName || item.productId?.title || item.name || "Product";
              const img   = item.productId?.images?.[0]?.url || "/no-image.png";
              const price = item.priceAtAdded || item.price || 0;
              return (
                <Box key={i} display="flex" alignItems="center" gap={1.5} mb={i < order.items.length - 1 ? 1.5 : 0}>
                  <Box component="img" src={img} alt={name} onError={(e) => { e.target.src = "/no-image.png" }}
                    sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: "cover", border: "1px solid #e2e8f0" }} />
                  <Box flex={1}>
                    <Typography fontSize={13} fontWeight={600}>{name}</Typography>
                    <Typography fontSize={11} color="text.secondary">Qty: {item.quantity}</Typography>
                  </Box>
                  <Typography fontSize={13} fontWeight={700} color="#3b82f6">₹{(price * item.quantity).toFixed(2)}</Typography>
                </Box>
              );
            })}
            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography fontSize={13} fontWeight={700}>Total</Typography>
              <Typography fontSize={14} fontWeight={800} color="#1e293b">₹{order.totalAmount?.toFixed(2) || "—"}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Delivery Address */}
        <Box>
          <Typography fontWeight={700} fontSize={13} mb={1.5}>Delivery Address</Typography>
          <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 2, border: "1px solid #e2e8f0" }}>
            {(() => {
              const a = order.address || {};
              return (
                <>
                  <Typography fontWeight={700} fontSize={14}>{a.fullName || "—"}</Typography>
                  <Typography fontSize={12} color="text.secondary" mt={0.5} lineHeight={1.8}>
                    {a.addressLine}<br />
                    {a.city}, {a.state} – {a.pincode}<br />
                    {a.phone}
                  </Typography>
                </>
              );
            })()}
          </Box>

          {/* Assigned Agent (if any) */}
          {order.assignedAgent && (
            <>
              <Typography fontWeight={700} fontSize={13} mt={2} mb={1}>Assigned Agent</Typography>
              <Box sx={{ bgcolor: "#f0fdf4", borderRadius: 2, p: 2, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar sx={{ bgcolor: "#16a34a", color: "#fff", width: 32, height: 32, fontSize: 14, fontWeight: 700 }}>
                  {order.assignedAgent.name?.[0]?.toUpperCase() || "A"}
                </Avatar>
                <Box>
                  <Typography fontSize={13} fontWeight={700} color="#15803d">{order.assignedAgent.name}</Typography>
                  <Typography fontSize={11} color="text.secondary" fontFamily="monospace">{order.assignedAgent.agentId}</Typography>
                </Box>
                <Chip label="Assigned" size="small" sx={{ ml: "auto", bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: 10 }} />
              </Box>
            </>
          )}

          {/* Tracking */}
          <Typography fontWeight={700} fontSize={13} mt={2} mb={1}>Tracking History</Typography>
          <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 2, border: "1px solid #e2e8f0" }}>
            {(order.orderStatusHistory || [{ status: order.orderStatus, timestamp: order.createdAt }]).map((h, i) => (
              <Box key={i} display="flex" alignItems="flex-start" gap={1.5} mb={i < (order.orderStatusHistory?.length || 1) - 1 ? 1.5 : 0}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#3b82f6", mt: 0.7, flexShrink: 0 }} />
                <Box>
                  <Typography fontSize={13} fontWeight={600}>{h.status}</Typography>
                  <Typography fontSize={11} color="text.secondary">
                    {h.timestamp ? new Date(h.timestamp).toLocaleString("en-IN") : "—"}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Order Info + Actions */}
        <Box>
          <Typography fontWeight={700} fontSize={13} mb={1.5}>Order Info</Typography>
          <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 2, border: "1px solid #e2e8f0", mb: 2 }}>
            {[
              ["Order ID",       `#${order._id?.slice(-8).toUpperCase()}`],
              ["Type",           order.orderType || "Normal"],
              ["Payment",        order.paymentMode || "COD"],
              ["Payment Status", order.paymentStatus || "PENDING"],
              ["Placed On",      order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "—"],
              ["Invoice Ready",  order.invoiceReady ? "Yes" : "Not yet"],
            ].map(([k, v]) => (
              <Box key={k} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography fontSize={12} color="text.secondary">{k}</Typography>
                <Typography fontSize={12} fontWeight={600}>{v}</Typography>
              </Box>
            ))}
          </Box>

          {/* Actions */}
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Button fullWidth variant="contained" startIcon={<Edit />}
              onClick={() => onEdit(order)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600,
                bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" } }}>
              Update Order Status
            </Button>
            <Button fullWidth variant="outlined" startIcon={<Receipt />}
              onClick={() => onInvoice(order)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600,
                borderColor: "#7c3aed", color: "#7c3aed",
                "&:hover": { bgcolor: "#faf5ff", borderColor: "#6d28d9" } }}>
              View / Download Invoice
            </Button>
            {/* ── Assign Agent button ── */}
            <Button fullWidth variant="outlined" startIcon={<TwoWheeler />}
              onClick={() => onAssign(order)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600,
                borderColor: "#16a34a", color: "#16a34a",
                "&:hover": { bgcolor: "#f0fdf4", borderColor: "#15803d" } }}>
              {order.assignedAgent ? "Reassign Agent" : "Assign Delivery Agent"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ── MAIN COMPONENT ────────────────────────────────────── */
export default function D2CAllOrders() {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId,   setExpandedId]   = useState(null);
  const [editOrder,    setEditOrder]    = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [assignOrder,  setAssignOrder]  = useState(null);   // ← NEW
  const [snackbar,     setSnackbar]     = useState({ open: false, message: "", severity: "success" });

  const notify = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res   = await axios.get(`${BASE_API}/api/orders/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || res.data || []);
    } catch (e) {
      notify(e.response?.data?.message || "Failed to fetch orders.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (
      o._id?.toLowerCase().includes(q) ||
      o.userId?.name?.toLowerCase().includes(q) ||
      o.userId?.email?.toLowerCase().includes(q) ||
      o.address?.fullName?.toLowerCase().includes(q)
    );
    const matchStatus = statusFilter === "all" || o.orderStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:      orders.length,
    placed:     orders.filter(o => o.orderStatus === "PLACED").length,
    processing: orders.filter(o => o.orderStatus === "PROCESSING").length,
    delivered:  orders.filter(o => o.orderStatus === "DELIVERED").length,
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1e293b" mb={0.5}>
            All D2C Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage orders · Update status · View & download invoices · Assign delivery agents
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={fetchOrders} variant="outlined"
          sx={{ textTransform: "none", borderRadius: 2 }}>
          Refresh
        </Button>
      </Box>

      {/* Stats */}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr 1fr", sm: "repeat(4,1fr)" }} gap={2} mb={3}>
        {[
          { label: "Total Orders",  value: stats.total,      color: "#3b82f6", bg: "#eff6ff" },
          { label: "Placed",        value: stats.placed,     color: "#ea580c", bg: "#fff7ed" },
          { label: "Processing",    value: stats.processing, color: "#7c3aed", bg: "#faf5ff" },
          { label: "Delivered",     value: stats.delivered,  color: "#16a34a", bg: "#f0fdf4" },
        ].map((s) => (
          <Paper key={s.label} elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: s.bg, border: "1px solid #e2e8f0" }}>
            <Typography fontSize={12} color="text.secondary" mb={0.5}>{s.label}</Typography>
            <Typography fontSize={22} fontWeight={800} color={s.color}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <TextField size="small" placeholder="Search by name, email, order ID…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 270, bgcolor: "#fff", borderRadius: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status" sx={{ bgcolor: "#fff" }}>
            <MenuItem value="all">All statuses</MenuItem>
            {[...STATUS_STEPS, "Cancelled"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          Showing <strong>{filtered.length}</strong> of <strong>{orders.length}</strong> orders
        </Typography>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell width={40} />
                {["ORDER ID","CUSTOMER","ITEMS","AMOUNT","STATUS","AGENT","DATE","ACTIONS"].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#64748b" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Typography fontSize={36} mb={1}>📦</Typography>
                    <Typography fontWeight={600} color="text.secondary">No orders found</Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.map((order) => {
                const isExpanded = expandedId === order._id;
                const customer   = order.userId || {};
                const name       = order.address?.fullName || customer.name || customer.email || "—";
                const email      = customer.email || "—";
                const initials   = name[0]?.toUpperCase() || "U";

                return (
                  <React.Fragment key={order._id}>
                    <TableRow
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" }, bgcolor: isExpanded ? "#f0f4ff" : "inherit" }}
                      onClick={() => setExpandedId(isExpanded ? null : order._id)}
                    >
                      <TableCell>
                        <IconButton size="small">
                          {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={700} fontFamily="monospace" color="#4f46e5">
                          #{order._id?.slice(-8).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "#e0e7ff", color: "#4f46e5", fontWeight: 700, fontSize: 14 }}>
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography fontSize={13} fontWeight={600}>{name}</Typography>
                            <Typography fontSize={11} color="text.secondary">{email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13}>{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={700}>₹{order.totalAmount?.toFixed(2) || "—"}</Typography>
                      </TableCell>
                      <TableCell><StatusChip status={order.orderStatus} /></TableCell>

                      {/* ── Agent column ── */}
                      <TableCell>
                        {order.assignedAgent ? (
                          <Tooltip title={`Agent ID: ${order.assignedAgent.agentId}`}>
                            <Box display="flex" alignItems="center" gap={0.8}>
                              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#16a34a", flexShrink: 0 }} />
                              <Typography fontSize={12} fontWeight={600} color="#15803d">
                                {order.assignedAgent.name}
                              </Typography>
                            </Box>
                          </Tooltip>
                        ) : (
                          <Typography fontSize={11} color="#cbd5e1" fontWeight={500}>Unassigned</Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography fontSize={12} color="text.secondary">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Update status">
                            <IconButton size="small" onClick={() => setEditOrder(order)}
                              sx={{ bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}>
                              <Edit fontSize="small" sx={{ color: "#3b82f6" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View invoice">
                            <IconButton size="small" onClick={() => setInvoiceOrder(order)}
                              sx={{ bgcolor: "#faf5ff", "&:hover": { bgcolor: "#ede9fe" } }}>
                              <Receipt fontSize="small" sx={{ color: "#7c3aed" }} />
                            </IconButton>
                          </Tooltip>
                          {/* ── Assign agent icon button ── */}
                          <Tooltip title={order.assignedAgent ? "Reassign agent" : "Assign delivery agent"}>
                            <IconButton size="small" onClick={() => setAssignOrder(order)}
                              sx={{ bgcolor: "#f0fdf4", "&:hover": { bgcolor: "#dcfce7" } }}>
                              <PersonSearch fontSize="small" sx={{ color: "#16a34a" }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                          <OrderDetailRow
                            order={order}
                            onEdit={setEditOrder}
                            onInvoice={setInvoiceOrder}
                            onAssign={setAssignOrder}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Update Status Dialog */}
      <UpdateStatusDialog
        open={!!editOrder} order={editOrder}
        onClose={() => setEditOrder(null)}
        onUpdated={(msg, sev) => { notify(msg, sev); fetchOrders(); }}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        open={!!invoiceOrder}
        order={invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />

      {/* ── Assign Agent Dialog ── */}
      <AssignAgentDialog
        open={!!assignOrder}
        order={assignOrder}
        onClose={() => setAssignOrder(null)}
        onAssigned={(msg, sev) => { notify(msg, sev); fetchOrders(); }}
      />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}