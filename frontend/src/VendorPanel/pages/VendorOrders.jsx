// src/VendorPanel/pages/VendorOrders.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StorefrontIcon from "@mui/icons-material/Storefront";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  import.meta.env.VITE_API_BASE_URL;

// ── Your main storefront URL ───────────────────────────────────────
const SHOP_URL = import.meta.env.VITE_SHOP_URL || "http://localhost:5173";

const vendorApi = axios.create({ baseURL: API_BASE });
vendorApi.interceptors.request.use((cfg) => {
  const token =
    localStorage.getItem("vendorToken") || localStorage.getItem("adminToken");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const STATUS_COLORS = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "error",
  returned: "error",
  placed: "default",
};

const ALLOWED_NEXT_STATUS = {
  pending: ["confirmed", "cancelled"],
  placed: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export default function VendorOrders() {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.defaultTab ?? 0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading]                   = useState(true);   
  const [error, setError]                       = useState("");      
  const [purchases, setPurchases]               = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesError, setPurchasesError]     = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  // ── Fetch incoming orders 
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorApi.get("/api/vendor/orders");
      setOrders(res.data?.data || []);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch vendor's own purchases (orders placed on the main site) ─
  // ── Replace fetchPurchases ─────────────────────────────────────
const fetchPurchases = useCallback(async () => {
  setPurchasesLoading(true);
  setPurchasesError("");
  try {
    const res = await vendorApi.get("/api/vendor/orders/purchases");
    setPurchases(res.data?.data || []);
  } catch (err) {
    setPurchasesError(
      err.response?.data?.message || "Failed to load purchases. Tap retry."
    );
  } finally {
    setPurchasesLoading(false);
  }
}, []);

  useEffect(() => {
  fetchOrders();
}, [fetchOrders]);

useEffect(() => {
  if (tab === 1) fetchPurchases();
}, [tab, fetchPurchases]);

  const openShop = () => {
    const token = localStorage.getItem("vendorToken");
    const user = localStorage.getItem("vendorUser"); // ← must also be set

    if (!token) {
      console.warn(
        "VendorOrders: no vendorToken found — shop link may not show banner",
      );
      window.open(SHOP_URL, "_blank");
      return;
    }

    localStorage.setItem("vendorToken", token);
    if (user) localStorage.setItem("vendorUser", user);

    // Store the return path for the banner's "Back to Dashboard" button
    sessionStorage.setItem("vendorReturnDashboard", "/vendor/dashboard");

    window.open(SHOP_URL, "_blank");
  };

  // ── Helpers ───────────────────────────────────────────────────────
  const customerName = (o) =>
    o.userId?.name || o.customer?.name || o.user?.name || "Guest";
  const customerEmail = (o) =>
    o.userId?.email || o.customer?.email || o.user?.email || "";
  const orderTotal = (o) => o.vendorTotal ?? o.totalAmount ?? 0;

  const stats = {
    total: orders.length,
    delivered: orders.filter((o) => o.orderStatus === "delivered").length,
    pending: orders.filter((o) =>
      ["pending", "placed", "confirmed", "processing"].includes(o.orderStatus),
    ).length,
    revenue: orders
      .filter((o) => o.orderStatus === "delivered")
      .reduce((s, o) => s + parseFloat(orderTotal(o)), 0),
  };

  const filtered = orders.filter((o) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      (o._id || "").toLowerCase().includes(s) ||
      customerName(o).toLowerCase().includes(s);
    const matchStatus = !filterStatus || o.orderStatus === filterStatus;
    return matchSearch && matchStatus;
  });
  const paged = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // ── Status update ─────────────────────────────────────────────────
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(true);
    setUpdateMsg("");
    try {
      await vendorApi.patch(`/api/vendor/orders/${orderId}/status`, {
        status: newStatus,
      });
      setUpdateMsg("Status updated successfully!");
      await fetchOrders();
      setSelected((prev) =>
        prev ? { ...prev, orderStatus: newStatus } : prev,
      );
    } catch (err) {
      setUpdateMsg(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} color="#111827">
            Vendor Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage incoming orders and track your purchases
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchOrders();
            fetchPurchases();
          }}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/*Tabs*/}
      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setPage(0);
        }}
        sx={{ mb: 2, borderBottom: "1px solid #e5e7eb" }}
      >
        <Tab
          label="Incoming Orders"
          icon={<LocalShippingIcon />}
          iconPosition="start"
        />
        <Tab
          label="My Purchases"
          icon={<ShoppingBagIcon />}
          iconPosition="start"
          sx={{ ml: 1 }}
        />
        <Tab
          label="Shop Products"
          icon={<StorefrontIcon />}
          iconPosition="start"
          sx={{ ml: 1 }}
        />
      </Tabs>

      {/*TAB 0 — Incoming Orders*/}
      {tab === 0 && (
  <>
    {error && (
      <Alert severity="error" sx={{ mb: 2 }} action={
        <Button color="inherit" size="small" onClick={fetchOrders}>Retry</Button>
      }>
        {error}
      </Alert>
    )}
          {/* Stat cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              {
                icon: <ShoppingBagIcon />,
                label: "Total Orders",
                value: stats.total,
                color: "#1565c0",
                bg: "#e3f2fd",
              },
              {
                icon: <LocalShippingIcon />,
                label: "Pending",
                value: stats.pending,
                color: "#d97706",
                bg: "#fff7ed",
              },
              {
                icon: <CheckCircleIcon />,
                label: "Delivered",
                value: stats.delivered,
                color: "#16a34a",
                bg: "#f0fdf4",
              },
              {
                icon: <CurrencyRupeeIcon />,
                label: "Revenue (Delivered)",
                value: `₹${stats.revenue.toFixed(0)}`,
                color: "#7c3aed",
                bg: "#f5f3ff",
              },
            ].map((s, i) => (
              <Grid key={i} size={{ xs: 6, md: 3 }}>
                <Card
                  sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}
                  elevation={0}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar
                        sx={{
                          bgcolor: s.bg,
                          color: s.color,
                          width: 40,
                          height: 40,
                        }}
                      >
                        {s.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {s.label}
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          color={s.color}
                        >
                          {s.value}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Filters */}
          <Paper
            variant="outlined"
            sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "#f8fafc" }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search by Order ID or Customer"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Order Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Order Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    {[
                      "pending",
                      "placed",
                      "confirmed",
                      "processing",
                      "shipped",
                      "delivered",
                      "cancelled",
                    ].map((s) => (
                      <MenuItem
                        key={s}
                        value={s}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearch("");
                    setFilterStatus("");
                    setPage(0);
                  }}
                >
                  Reset Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  {[
                    "Order ID",
                    "Customer",
                    "Items",
                    "Total",
                    "Payment",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <TableCell key={h}>
                      <b>{h}</b>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <ShoppingBagIcon
                        sx={{ fontSize: 48, color: "#d1d5db", mb: 1 }}
                      />
                      <Typography color="text.secondary" display="block">
                        No orders found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((order) => (
                    <TableRow key={order._id} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="primary.main"
                        >
                          #{(order._id || "").slice(-8).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {customerName(order)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customerEmail(order)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {(order.items || []).map((item, i) => (
                          <Box
                            key={i}
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={0.5}
                          >
                            {/* IMAGE */}
                            <Avatar
                              src={
                                item.productId?.images?.[0]?.url ||
                                item.productId?.images?.[0] ||
                                ""
                              }
                              variant="rounded"
                              sx={{ width: 32, height: 32 }}
                            />

                            {/* NAME */}
                            <Typography variant="body2" fontWeight={600}>
                              {item.productId?.brandName ||
                                item.name ||
                                "Product"}
                            </Typography>

                            {/* QTY */}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              × {item.quantity}
                            </Typography>
                          </Box>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700}>
                          ₹{orderTotal(order)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.paymentStatus || "pending"}
                          size="small"
                          color={
                            order.paymentStatus === "paid"
                              ? "success"
                              : "warning"
                          }
                          variant="outlined"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.orderStatus || "pending"}
                          size="small"
                          color={STATUS_COLORS[order.orderStatus] || "default"}
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString(
                                "en-IN",
                              )
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            setSelected(order);
                            setUpdateMsg("");
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </>
      )}

      {/* TAB 1 — My Purchases  */}
  
{tab === 1 && (
  <>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="subtitle2" color="text.secondary">
        Orders you placed on the Bioburg store
      </Typography>
      <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} onClick={openShop}>
        Shop More
      </Button>
    </Box>

    {/* Loading */}
    {purchasesLoading && (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    )}

    {/* Error with retry */}
    {!purchasesLoading && purchasesError && (
      <Alert
        severity="error"
        sx={{ mb: 2 }}
        action={
          <Button color="inherit" size="small" onClick={fetchPurchases}>
            Retry
          </Button>
        }
      >
        {purchasesError}
      </Alert>
    )}

    {/* Table — only shown when not loading and no error */}
    {!purchasesLoading && !purchasesError && (
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              {["Order ID", "Items", "Total", "Payment", "Status", "Date"].map((h) => (
                <TableCell key={h}><b>{h}</b></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <StorefrontIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 1 }} />
                  <Typography color="text.secondary" display="block" mb={1.5}>
                    No purchases yet
                  </Typography>
                  <Button variant="contained" size="small" startIcon={<OpenInNewIcon />} onClick={openShop}>
                    Visit Bioburg Store
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      #{(order._id || "").slice(-8).toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {(order.items || []).map((item, i) => (
                        <Box
                          key={i}
                          display="flex"
                          alignItems="center"
                          gap={1.5}
                          sx={{ p: 1, borderRadius: 2, bgcolor: "#f9fafb", border: "1px solid #eee" }}
                        >
                          <Avatar
                            variant="rounded"
                            src={item.productId?.images?.[0]?.url || item.productId?.images?.[0] || ""}
                            sx={{ width: 44, height: 44 }}
                          />
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={700} color="#111827">
                              {item.productId?.brandName || item.name || "Product"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Qty: {item.quantity} × ₹{item.price}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={700} color="#111827">
                            ₹{(item.quantity || 1) * (item.price || 0)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700}>₹{order.totalAmount || 0}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.paymentStatus || "pending"}
                      size="small"
                      color={order.paymentStatus === "paid" ? "success" : "warning"}
                      variant="outlined"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.orderStatus || "pending"}
                      size="small"
                      color={STATUS_COLORS[order.orderStatus] || "default"}
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </>
)}
      {/* TAB 2 — Shop Products */}
      {tab === 2 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={10}
          gap={3}
        >
          {/* Store icon */}
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#ede9fe 0%,#f5f3ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(124,58,237,0.15)",
            }}
          >
            <StorefrontIcon sx={{ fontSize: 54, color: "#7c3aed" }} />
          </Box>

          {/* Heading */}
          <Box textAlign="center" maxWidth={500}>
            <Typography
              variant="h5"
              fontWeight={800}
              color="#111827"
              gutterBottom
            >
              Shop on Bioburg
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              lineHeight={1.75}
            >
              Browse our full pharmaceutical catalog, place bulk orders, and
              enjoy exclusive vendor pricing — all on our dedicated storefront.
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1.5}>
              You're already signed in. Your orders will be linked to your
              vendor account automatically, and a&nbsp;
              <strong style={{ color: "#111827" }}>Back to Dashboard</strong>
              &nbsp;banner will appear at the top of the site.
            </Typography>
          </Box>

          {/* How it works — 3 steps */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            flexWrap="wrap"
            useFlexGap
          >
            {[
              { step: "1", label: "Click the button below", color: "#7c3aed" },
              { step: "2", label: "Shop & place your order", color: "#2563eb" },
              {
                step: "3",
                label: "See it in My Purchases above",
                color: "#059669",
              },
            ].map(({ step, label, color }) => (
              <Box
                key={step}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  minWidth: 200,
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    bgcolor: color,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {step}
                </Box>
                <Typography variant="body2" fontWeight={600} color="#374151">
                  {label}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* Feature chips */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="center"
            useFlexGap
          >
            {[
              "Bulk Pricing",
              "Wide Catalog",
              "Fast Delivery",
              "Secure Checkout",
              "GST Invoices",
            ].map((f) => (
              <Chip
                key={f}
                label={f}
                size="small"
                sx={{
                  bgcolor: "#ede9fe",
                  color: "#5b21b6",
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              />
            ))}
          </Stack>

          {/* CTA */}
          <Button
            variant="contained"
            size="large"
            endIcon={<OpenInNewIcon />}
            onClick={openShop}
            sx={{
              px: 5,
              py: 1.5,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: 15,
              textTransform: "none",
              background: "linear-gradient(135deg,#6d28d9 0%,#7c3aed 100%)",
              boxShadow: "0 4px 16px rgba(109,40,217,0.35)",
              "&:hover": {
                background: "linear-gradient(135deg,#5b21b6 0%,#6d28d9 100%)",
                boxShadow: "0 6px 20px rgba(109,40,217,0.45)",
              },
            }}
          >
            Open Bioburg Store
          </Button>

          <Typography variant="caption" color="text.secondary">
            Opens in a new tab · {SHOP_URL}
          </Typography>
        </Box>
      )}

      {/* ── Order Detail Modal ───────────────────────────────────────── */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="sm"
        fullWidth
      >
        {selected && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>
              Order #{(selected._id || "").slice(-8).toUpperCase()}
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Customer
              </Typography>
              <Typography variant="body2">{customerName(selected)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {customerEmail(selected)}
              </Typography>
              {selected.userId?.phone && (
                <Typography variant="body2" color="text.secondary">
                  {selected.userId.phone}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Your Items
              </Typography>
              <Stack spacing={1}>
                {(selected.items || []).map((item, i) => (
                  <Box
                    key={i}
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    sx={{ p: 1, bgcolor: "#f8fafc", borderRadius: 1 }}
                  >
                    <Avatar
                      variant="rounded"
                      src={item.productId?.images?.[0]?.url}
                      sx={{ width: 44, height: 44 }}
                    />
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={700}>
                        {item.productId?.brandName || item.name || "Product"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Qty: {item.quantity} × ₹{item.price}
                      </Typography>
                    </Box>
                    <Typography fontWeight={700}>
                      ₹{(item.quantity || 1) * (item.price || 0)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Update Status
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {(ALLOWED_NEXT_STATUS[selected.orderStatus] || []).map((s) => (
                  <Button
                    key={s}
                    variant="contained"
                    size="small"
                    disabled={updating}
                    onClick={() => handleStatusUpdate(selected._id, s)}
                    sx={{ textTransform: "capitalize" }}
                  >
                    Mark as {s}
                  </Button>
                ))}
                {(ALLOWED_NEXT_STATUS[selected.orderStatus] || []).length ===
                  0 && (
                  <Typography variant="body2" color="text.secondary">
                    No further changes allowed.
                  </Typography>
                )}
              </Box>
              {updateMsg && (
                <Alert
                  severity={updateMsg.includes("success") ? "success" : "error"}
                  sx={{ mt: 1 }}
                >
                  {updateMsg}
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
