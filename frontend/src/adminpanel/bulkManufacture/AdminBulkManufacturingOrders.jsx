import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import adminBulkManufacturingApi from "./adminBulkManufacturingApi";
import {
  AdminFranchiseBadge,
  AdminFranchiseButton,
  AdminFranchiseEmpty,
  AdminFranchiseHero,
  AdminFranchiseLoading,
  AdminFranchiseMetric,
  AdminFranchiseNotice,
  AdminFranchisePage,
  AdminFranchisePanel,
  adminFieldSx,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from "../franchise/adminFranchiseUi";

const STATUS_OPTIONS = [
  "ALL",
  "PLACED",
  "ACCEPTED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_MODE_OPTIONS = ["ALL", "COD", "ONLINE"];
const PAYMENT_STATUS_OPTIONS = ["ALL", "PENDING", "PAID", "FAILED"];

const defaultFilters = {
  search: "",
  status: "ALL",
  paymentMode: "ALL",
  paymentStatus: "ALL",
  accountId: "ALL",
  from: "",
  to: "",
};

const getStatusTone = (status) => {
  if (status === "DELIVERED") return "green";
  if (status === "CANCELLED") return "rose";
  if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(status)) return "blue";
  return "amber";
};

const getOrderCode = (order) =>
  order?.orderId ||
  order?.invoiceNumber ||
  String(order?._id || "").slice(-8).toUpperCase();

const formatAddress = (address = {}) =>
  [
    address.addressLine,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");

function DetailBlock({ label, value }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(255,255,255,0.02)",
      }}
    >
      <Typography sx={{ fontSize: 11, color: "#8da0ad", textTransform: "uppercase", letterSpacing: 1.6 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 1, fontWeight: 700, color: "#edf3f7", lineHeight: 1.7 }}>
        {value || "-"}
      </Typography>
    </Box>
  );
}

export default function AdminBulkManufacturingOrders() {
  const [data, setData] = useState({ orders: [], summary: {}, accounts: [] });
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState("");

  const activeFilterCount = useMemo(
    () =>
      [
        Boolean(filters.search),
        filters.status !== "ALL",
        filters.paymentMode !== "ALL",
        filters.paymentStatus !== "ALL",
        filters.accountId !== "ALL",
        Boolean(filters.from),
        Boolean(filters.to),
      ].filter(Boolean).length,
    [filters],
  );

  const fetchOrders = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const response = await adminBulkManufacturingApi.get("/orders", {
        params: nextFilters,
      });
      setData(response.data);
    } catch (ordersError) {
      console.error("Admin bulk orders load error:", ordersError);
      setError(
        ordersError.response?.data?.message ||
          "Unable to load bulk manufacturing website orders.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(defaultFilters);
  }, []);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setExpandedOrderId("");
    fetchOrders(defaultFilters);
  };

  if (loading) {
    return <AdminFranchiseLoading label="Loading bulk-manufacturing website orders..." />;
  }

  const summary = data.summary || {};
  const orders = data.orders || [];
  const accounts = data.accounts || [];

  return (
    <AdminFranchisePage>
      <AdminFranchiseHero
        eyebrow="Bulk Website Order Routing"
        title="Visibility into which website orders are owned by which bulk-manufacturing partner."
        description="Track routed customer orders, review the assigned bulk-manufacturing account, verify customer and item snapshots, and audit fulfilment movement from the super admin desk."
        actions={
          <>
            <AdminFranchiseButton variant="secondary" onClick={() => fetchOrders()}>
              Refresh desk
            </AdminFranchiseButton>
            <AdminFranchiseButton variant="secondary" onClick={resetFilters}>
              Reset filters
            </AdminFranchiseButton>
          </>
        }
        badges={[
          <AdminFranchiseBadge key="orders" tone="gold">
            {formatNumber(summary.totalOrders)} routed orders
          </AdminFranchiseBadge>,
          <AdminFranchiseBadge key="partners" tone="blue">
            {formatNumber(summary.activePartners)} active partners
          </AdminFranchiseBadge>,
          <AdminFranchiseBadge key="revenue" tone="green">
            {formatCurrency(summary.totalRevenue)}
          </AdminFranchiseBadge>,
        ]}
      />

      {error ? (
        <Box sx={{ mt: 3 }}>
          <AdminFranchiseNotice tone="error">{error}</AdminFranchiseNotice>
        </Box>
      ) : null}

      <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
        {[
          ["Total Orders", formatNumber(summary.totalOrders), "Bulk-owned customer orders currently matching the filter set"],
          ["Open Orders", formatNumber(summary.openOrders), "Orders still in active fulfilment movement"],
          ["Delivered", formatNumber(summary.deliveredOrders), "Orders already completed for the assigned partner"],
          ["Cancelled", formatNumber(summary.cancelledOrders), "Orders cancelled after routing"],
          ["Paid Orders", formatNumber(summary.paidOrders), "Orders already paid by customers"],
          ["Invoice Ready", formatNumber(summary.invoiceReadyOrders), "Orders where invoice generation has started"],
          ["Units", formatNumber(summary.totalUnits), "Total units across the filtered routed orders"],
          ["Average Value", formatCurrency(summary.averageOrderValue), "Average order value for the current result set"],
        ].map(([label, value, helper], index) => (
          <Grid item xs={12} sm={6} xl={3} key={label}>
            <AdminFranchiseMetric
              label={label}
              value={value}
              helper={helper}
              accent={index === 0}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 2.5 }}>
        <AdminFranchisePanel
          title="Order filters"
          subtitle="Search by order, invoice, customer, city, or product name, and isolate routed orders by bulk-manufacturing partner."
          action={
            <AdminFranchiseBadge tone={activeFilterCount ? "gold" : "neutral"}>
              {activeFilterCount} active filters
            </AdminFranchiseBadge>
          }
        >
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search order, invoice, customer, city, product"
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
                sx={adminFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                sx={adminFieldSx}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                value={filters.paymentMode}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    paymentMode: event.target.value,
                  }))
                }
                sx={adminFieldSx}
              >
                {PAYMENT_MODE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                value={filters.paymentStatus}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    paymentStatus: event.target.value,
                  }))
                }
                sx={adminFieldSx}
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                value={filters.accountId}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    accountId: event.target.value,
                  }))
                }
                sx={adminFieldSx}
              >
                <MenuItem value="ALL">All partners</MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.companyName || account.email}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={filters.from}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
                sx={adminFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={filters.to}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
                sx={adminFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <AdminFranchiseButton
                variant="secondary"
                onClick={() => fetchOrders(filters)}
                sx={{ width: "100%" }}
              >
                Apply filters
              </AdminFranchiseButton>
            </Grid>
          </Grid>
        </AdminFranchisePanel>
      </Box>

      <Box sx={{ mt: 2.5 }}>
        <AdminFranchisePanel
          title="Routed order ledger"
          subtitle="Each card shows which bulk-manufacturing account owns the order, along with the customer and fulfilment snapshot."
        >
          {orders.length ? (
            <Stack spacing={1.6}>
              {orders.map((order) => {
                const expanded = expandedOrderId === order._id;
                return (
                  <Box
                    key={order._id}
                    sx={{
                      p: 2.4,
                      borderRadius: 4,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", xl: "row" }}
                      spacing={2}
                      justifyContent="space-between"
                    >
                      <Box sx={{ maxWidth: 900 }}>
                        <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                          {getOrderCode(order)}
                        </Typography>
                        <Typography sx={{ mt: 0.8, color: "#8da0ad", lineHeight: 1.75 }}>
                          Owner {order.bulkManufacturingAccountId?.companyName || order.bulkManufacturingAccountId?.email || "Unknown partner"} | Customer {order.address?.fullName || order.userId?.name || "N/A"} | {formatCurrency(order.totalAmount)}
                        </Typography>
                        <Typography sx={{ mt: 0.8, color: "#8da0ad", lineHeight: 1.75 }}>
                          {order.address?.city || "Unknown city"} | {order.address?.phone || order.userId?.phone || "No phone"} | {formatDateTime(order.createdAt)}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.4 }}>
                          <AdminFranchiseBadge tone={getStatusTone(order.orderStatus)}>
                            {order.orderStatus}
                          </AdminFranchiseBadge>
                          <AdminFranchiseBadge tone={order.paymentStatus === "PAID" ? "green" : "amber"}>
                            {order.paymentStatus}
                          </AdminFranchiseBadge>
                          <AdminFranchiseBadge tone="blue">
                            {order.paymentMode || "NA"}
                          </AdminFranchiseBadge>
                          <AdminFranchiseBadge tone="neutral">
                            {formatNumber(order.items?.length || 0)} item(s)
                          </AdminFranchiseBadge>
                        </Stack>
                      </Box>

                      <Stack direction={{ xs: "row", xl: "column" }} spacing={1}>
                        <AdminFranchiseButton
                          variant="secondary"
                          onClick={() =>
                            setExpandedOrderId((current) =>
                              current === order._id ? "" : order._id,
                            )
                          }
                        >
                          {expanded ? (
                            <span className="inline-flex items-center gap-1">
                              <ExpandLess fontSize="small" />
                              Hide details
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <ExpandMore fontSize="small" />
                              Open details
                            </span>
                          )}
                        </AdminFranchiseButton>
                      </Stack>
                    </Stack>

                    {expanded ? (
                      <Box sx={{ mt: 2.4 }}>
                        <Grid container spacing={1.5}>
                          <Grid item xs={12} md={6} xl={3}>
                            <DetailBlock
                              label="Partner login"
                              value={order.bulkManufacturingAccountId?.username || order.bulkManufacturingAccountId?.email}
                            />
                          </Grid>
                          <Grid item xs={12} md={6} xl={3}>
                            <DetailBlock
                              label="Invoice"
                              value={order.invoiceNumber || (order.invoiceReady ? "Ready" : "Pending")}
                            />
                          </Grid>
                          <Grid item xs={12} md={6} xl={3}>
                            <DetailBlock
                              label="Delivered at"
                              value={formatDate(order.deliveredAt)}
                            />
                          </Grid>
                          <Grid item xs={12} md={6} xl={3}>
                            <DetailBlock
                              label="Address"
                              value={formatAddress(order.address)}
                            />
                          </Grid>
                        </Grid>

                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 3,
                            border: "1px solid rgba(255,255,255,0.08)",
                            bgcolor: "rgba(255,255,255,0.015)",
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, color: "#edf3f7", mb: 1.5 }}>
                            Item snapshot
                          </Typography>
                          <Stack spacing={1.2}>
                            {(order.items || []).map((item, index) => (
                              <Box
                                key={`${order._id}-item-${index}`}
                                sx={{
                                  p: 1.6,
                                  borderRadius: 3,
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  bgcolor: "rgba(255,255,255,0.02)",
                                }}
                              >
                                <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                                  {item.name || "Product"}
                                </Typography>
                                <Typography sx={{ mt: 0.6, color: "#8da0ad", lineHeight: 1.7 }}>
                                  {item.manufacturer || "Manufacturer unavailable"} | Qty {formatNumber(item.quantity)} | {formatCurrency(Number(item.priceAtAdded || item.price || 0) * Number(item.quantity || 0))}
                                </Typography>
                                {item.genericName || item.hsn ? (
                                  <Typography sx={{ mt: 0.6, color: "#8da0ad", lineHeight: 1.7 }}>
                                    {item.genericName ? `${item.genericName}` : ""}
                                    {item.genericName && item.hsn ? " | " : ""}
                                    {item.hsn ? `HSN ${item.hsn}` : ""}
                                  </Typography>
                                ) : null}
                              </Box>
                            ))}
                          </Stack>
                        </Box>

                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 3,
                            border: "1px solid rgba(255,255,255,0.08)",
                            bgcolor: "rgba(255,255,255,0.015)",
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, color: "#edf3f7", mb: 1.5 }}>
                            Tracking timeline
                          </Typography>
                          {(order.trackingHistory || []).length ? (
                            <Stack spacing={1.2}>
                              {[...(order.trackingHistory || [])]
                                .slice(-6)
                                .reverse()
                                .map((entry, index) => (
                                  <Box
                                    key={`${order._id}-track-${index}`}
                                    sx={{
                                      p: 1.6,
                                      borderRadius: 3,
                                      border: "1px solid rgba(255,255,255,0.06)",
                                      bgcolor: "rgba(255,255,255,0.02)",
                                    }}
                                  >
                                    <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                                      {entry.status || "Updated"}
                                    </Typography>
                                    <Typography sx={{ mt: 0.6, color: "#8da0ad", lineHeight: 1.7 }}>
                                      {formatDateTime(entry.time || entry.timestamp)}
                                    </Typography>
                                    {entry.note ? (
                                      <Typography sx={{ mt: 0.6, color: "#8da0ad", lineHeight: 1.7 }}>
                                        {entry.note}
                                      </Typography>
                                    ) : null}
                                  </Box>
                                ))}
                            </Stack>
                          ) : (
                            <Typography sx={{ color: "#8da0ad" }}>
                              Tracking history is not available yet.
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ) : null}
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <AdminFranchiseEmpty
              title="No routed orders found"
              text="Adjust filters or wait for customer orders that belong to bulk-manufacturing-owned products."
            />
          )}
        </AdminFranchisePanel>
      </Box>
    </AdminFranchisePage>
  );
}
