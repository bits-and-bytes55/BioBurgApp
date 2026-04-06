import React, { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  ReceiptLong,
  Refresh,
} from "@mui/icons-material";
import bulkManufacturingApi from "../bulkManufactureApi";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleEmptyState,
  ConsoleHeader,
  ConsoleLoading,
  ConsoleMetricCard,
  ConsoleNotice,
  ConsolePage,
  ConsolePanel,
  consoleInputClass,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from "../../Franchise/components/consoleUi";

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
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount_high", label: "Highest amount" },
  { value: "amount_low", label: "Lowest amount" },
];

const STATUS_TRANSITIONS = {
  PLACED: ["ACCEPTED", "CONFIRMED", "CANCELLED"],
  ACCEPTED: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
};

const DEFAULT_FILTERS = {
  search: "",
  status: "ALL",
  paymentMode: "ALL",
  paymentStatus: "ALL",
  from: "",
  to: "",
  sortBy: "newest",
};

const getOrderIdLabel = (order) =>
  order?.orderId ||
  order?.invoiceNumber ||
  String(order?._id || "").slice(-8).toUpperCase();

const getStatusTone = (status) => {
  if (status === "DELIVERED") return "green";
  if (status === "CANCELLED") return "rose";
  if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(status)) return "blue";
  return "amber";
};

const getPaymentTone = (status) => {
  if (status === "PAID") return "green";
  if (status === "FAILED") return "rose";
  return "amber";
};

const countActiveFilters = (filters) =>
  [
    Boolean(filters.search),
    filters.status !== "ALL",
    filters.paymentMode !== "ALL",
    filters.paymentStatus !== "ALL",
    Boolean(filters.from),
    Boolean(filters.to),
  ].filter(Boolean).length;

const exportOrdersToCsv = (orders) => {
  if (!orders.length) return;

  const rows = orders.map((order) => ({
    order_id: getOrderIdLabel(order),
    customer: order.userId?.name || order.address?.fullName || "",
    customer_phone: order.userId?.phone || order.address?.phone || "",
    email: order.userId?.email || "",
    order_status: order.orderStatus || "",
    payment_mode: order.paymentMode || "",
    payment_status: order.paymentStatus || "",
    total_amount: Number(order.totalAmount || 0),
    item_count: Number(order.items?.length || 0),
    created_at: order.createdAt
      ? new Date(order.createdAt).toLocaleString("en-IN")
      : "",
    items: (order.items || [])
      .map((item) => item.name || item.productId?.brandName || "Product")
      .join(" | "),
  }));

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  link.download = `bulk-manufacturing-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const formatAddress = (address = {}) =>
  [
    address.addressLine,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");

function FilterField({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function DetailBlock({ label, value }) {
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

export default function Orders() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [detailMap, setDetailMap] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState("");

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  const fetchOrders = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const response = await bulkManufacturingApi.get(
        "/bulk-manufacturing-portal/orders",
        {
          params: nextFilters,
        },
      );

      setOrders(response.data.orders || []);
      setSummary(response.data.summary || {});
    } catch (fetchError) {
      console.error("Bulk manufacturing orders fetch error:", fetchError);
      setError(
        fetchError.response?.data?.message ||
          "Unable to load bulk manufacturing orders.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId, force = false) => {
    if (!orderId) return;
    if (!force && detailMap[orderId]) return;

    try {
      setDetailLoadingId(orderId);
      const response = await bulkManufacturingApi.get(
        `/bulk-manufacturing-portal/orders/${orderId}`,
      );

      setDetailMap((current) => ({
        ...current,
        [orderId]: response.data.order,
      }));
    } catch (detailError) {
      console.error("Bulk manufacturing order detail error:", detailError);
      setError(
        detailError.response?.data?.message ||
          "Unable to load order details right now.",
      );
    } finally {
      setDetailLoadingId("");
    }
  };

  useEffect(() => {
    fetchOrders(DEFAULT_FILTERS);
  }, []);

  const applyFilters = () => fetchOrders(filters);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setExpandedOrderId("");
    fetchOrders(DEFAULT_FILTERS);
  };

  const toggleOrder = async (orderId) => {
    const nextId = expandedOrderId === orderId ? "" : orderId;
    setExpandedOrderId(nextId);

    if (nextId) {
      await fetchOrderDetail(orderId);
    }
  };

  const updateOrderStatus = async (orderId, nextStatus) => {
    try {
      setUpdatingStatusId(`${orderId}:${nextStatus}`);
      setError("");

      await bulkManufacturingApi.patch(
        `/bulk-manufacturing-portal/orders/${orderId}/status`,
        { status: nextStatus },
      );

      await fetchOrders(filters);
      await fetchOrderDetail(orderId, true);
    } catch (updateError) {
      console.error("Bulk manufacturing order status update error:", updateError);
      setError(
        updateError.response?.data?.message ||
          "Unable to update order status.",
      );
    } finally {
      setUpdatingStatusId("");
    }
  };

  if (loading) {
    return <ConsoleLoading label="Loading owned website orders..." />;
  }

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          eyebrow="Bulk Order Desk"
          title="Website orders owned by your bulk-manufacturing catalog."
          description="Customer orders for your published products land here. Filter the ledger, open an order, review customer details, and move fulfilment forward from one premium operations desk."
          badges={
            <>
              <ConsoleBadge tone="blue">
                {formatNumber(summary.totalOrders || 0)} orders
              </ConsoleBadge>
              <ConsoleBadge tone={activeFilterCount ? "amber" : "neutral"}>
                {activeFilterCount} active filters
              </ConsoleBadge>
              <ConsoleBadge tone="green">
                {formatCurrency(summary.totalRevenue || 0)} revenue
              </ConsoleBadge>
            </>
          }
          actions={
            <>
              <ConsoleButton
                onClick={() => exportOrdersToCsv(orders)}
                disabled={!orders.length}
              >
                Export CSV
              </ConsoleButton>
              <ConsoleButton variant="secondary" onClick={applyFilters}>
                <span className="inline-flex items-center gap-2">
                  <ReceiptLong fontSize="small" />
                  Apply filters
                </span>
              </ConsoleButton>
              <ConsoleButton variant="secondary" onClick={resetFilters}>
                Reset
              </ConsoleButton>
            </>
          }
        />

        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ConsoleMetricCard
            label="Total Orders"
            primary={formatNumber(summary.totalOrders || 0)}
            secondary={`${formatNumber(summary.totalUnits || 0)} units across the current result set`}
            accent
          />
          <ConsoleMetricCard
            label="Open Pipeline"
            primary={formatNumber(summary.openOrders || 0)}
            secondary="Orders still waiting for movement"
          />
          <ConsoleMetricCard
            label="Delivered"
            primary={formatNumber(summary.deliveredOrders || 0)}
            secondary={`${formatNumber(summary.cancelledOrders || 0)} cancelled`}
          />
          <ConsoleMetricCard
            label="Paid Orders"
            primary={formatNumber(summary.paidOrders || 0)}
            secondary={`${formatNumber(summary.pendingPaymentOrders || 0)} pending payment`}
          />
          <ConsoleMetricCard
            label="Average Value"
            primary={formatCurrency(summary.averageOrderValue || 0)}
            secondary={formatCurrency(summary.totalRevenue || 0)}
          />
        </div>

        <ConsolePanel
          title="Filter console"
          subtitle="Search by order, invoice, customer, phone, city, or product name before reviewing the ledger."
          action={
            <ConsoleButton variant="secondary" onClick={() => fetchOrders(filters)}>
              <span className="inline-flex items-center gap-2">
                <Refresh fontSize="small" />
                Refresh
              </span>
            </ConsoleButton>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[2fr_repeat(6,minmax(0,1fr))]">
            <FilterField label="Search">
              <input
                className={consoleInputClass}
                placeholder="Order, invoice, customer, city, product..."
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
                onKeyDown={(event) => event.key === "Enter" && applyFilters()}
              />
            </FilterField>

            <FilterField label="Status">
              <select
                className={consoleInputClass}
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Payment mode">
              <select
                className={consoleInputClass}
                value={filters.paymentMode}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    paymentMode: event.target.value,
                  }))
                }
              >
                {PAYMENT_MODE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Payment status">
              <select
                className={consoleInputClass}
                value={filters.paymentStatus}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    paymentStatus: event.target.value,
                  }))
                }
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Sort by">
              <select
                className={consoleInputClass}
                value={filters.sortBy}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sortBy: event.target.value,
                  }))
                }
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="From">
              <input
                className={consoleInputClass}
                type="date"
                value={filters.from}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
              />
            </FilterField>

            <FilterField label="To">
              <input
                className={consoleInputClass}
                type="date"
                value={filters.to}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
              />
            </FilterField>
          </div>
        </ConsolePanel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_340px]">
          <ConsolePanel
            title="Owned order ledger"
            subtitle="Open a card to inspect items, customer snapshot, payment status, and fulfilment controls."
            action={
              <div className="text-sm text-slate-500">
                {formatNumber(orders.length)} result{orders.length === 1 ? "" : "s"}
              </div>
            }
          >
            {orders.length ? (
              <div className="grid gap-4">
                {orders.map((order) => {
                  const expanded = expandedOrderId === order._id;
                  const detail = detailMap[order._id] || order;
                  const nextStatuses =
                    STATUS_TRANSITIONS[detail.orderStatus] || [];

                  return (
                    <div
                      key={order._id}
                      className="rounded-[28px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(14,20,26,0.92),rgba(8,12,17,0.9))] p-5 shadow-[0_18px_46px_rgba(0,0,0,0.24)]"
                    >
                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_220px_220px]">
                        <div>
                          <div className="console-mono text-xs font-bold tracking-[0.16em] text-slate-400">
                            {getOrderIdLabel(order)}
                          </div>
                          <div className="mt-2 text-xl font-semibold text-slate-100">
                            {order.userId?.name || order.address?.fullName || "Customer"}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            {(order.userId?.email || order.address?.phone || "No direct contact") +
                              " | " +
                              formatDateTime(order.createdAt)}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <ConsoleBadge tone={getStatusTone(order.orderStatus)}>
                              {order.orderStatus || "-"}
                            </ConsoleBadge>
                            <ConsoleBadge tone={getPaymentTone(order.paymentStatus)}>
                              {order.paymentStatus || "-"}
                            </ConsoleBadge>
                            <ConsoleBadge tone="neutral">
                              {order.paymentMode || "-"}
                            </ConsoleBadge>
                            <ConsoleBadge tone="blue">
                              {formatNumber(order.items?.length || 0)} item(s)
                            </ConsoleBadge>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                            Commercial snapshot
                          </div>
                          <div className="mt-3 text-2xl font-semibold text-amber-400">
                            {formatCurrency(order.totalAmount || 0)}
                          </div>
                          <div className="mt-3 text-sm text-slate-400">
                            Invoice {order.invoiceNumber || (order.invoiceReady ? "ready" : "pending")}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            Fulfilment owner {order.fulfilmentOwnerType || "GENERAL"}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-start justify-end gap-2">
                          <ConsoleButton
                            variant="secondary"
                            onClick={() => toggleOrder(order._id)}
                          >
                            <span className="inline-flex items-center gap-2">
                              {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                              {expanded ? "Hide details" : "Open details"}
                            </span>
                          </ConsoleButton>
                        </div>
                      </div>

                      {expanded ? (
                        <div className="mt-5 grid gap-5">
                          {detailLoadingId === order._id ? (
                            <div className="flex items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02] px-6 py-10">
                              <CircularProgress size={26} sx={{ color: "#d7b26d" }} />
                            </div>
                          ) : (
                            <>
                              <div className="grid gap-4 xl:grid-cols-4">
                                <DetailBlock
                                  label="Customer"
                                  value={detail.userId?.name || detail.address?.fullName}
                                />
                                <DetailBlock
                                  label="Phone"
                                  value={detail.userId?.phone || detail.address?.phone}
                                />
                                <DetailBlock
                                  label="Email"
                                  value={detail.userId?.email}
                                />
                                <DetailBlock
                                  label="Delivery Address"
                                  value={formatAddress(detail.address)}
                                />
                              </div>

                              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
                                <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4">
                                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">
                                    Ordered items
                                  </div>
                                  <div className="mt-4 grid gap-3">
                                    {(detail.items || []).map((item, index) => (
                                      <div
                                        key={`${detail._id}-item-${index}`}
                                        className="grid gap-3 rounded-2xl border border-white/[0.06] bg-black/20 p-4 md:grid-cols-[minmax(0,1fr)_120px_120px]"
                                      >
                                        <div>
                                          <div className="text-sm font-semibold text-slate-100">
                                            {item.name || item.productId?.brandName || "Product"}
                                          </div>
                                          <div className="mt-1 text-xs leading-6 text-slate-500">
                                            {item.manufacturer || item.productId?.manufacturer || "Manufacturer unavailable"}
                                            {item.genericName ? ` | ${item.genericName}` : ""}
                                            {item.hsn ? ` | HSN ${item.hsn}` : ""}
                                          </div>
                                        </div>
                                        <div className="text-sm text-slate-300">
                                          Qty {formatNumber(item.quantity || 0)}
                                        </div>
                                        <div className="text-sm font-semibold text-amber-300">
                                          {formatCurrency(
                                            Number(item.priceAtAdded || item.price || 0) *
                                              Number(item.quantity || 0),
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="grid gap-4">
                                  <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4">
                                    <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">
                                      Fulfilment controls
                                    </div>
                                    {nextStatuses.length ? (
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        {nextStatuses.map((status) => {
                                          const actionKey = `${order._id}:${status}`;
                                          return (
                                            <ConsoleButton
                                              key={status}
                                              onClick={() =>
                                                updateOrderStatus(order._id, status)
                                              }
                                              disabled={updatingStatusId === actionKey}
                                            >
                                              {updatingStatusId === actionKey
                                                ? "Updating..."
                                                : status.replaceAll("_", " ")}
                                            </ConsoleButton>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="mt-4 text-sm leading-6 text-slate-500">
                                        No further partner status movement is available for
                                        this order.
                                      </div>
                                    )}
                                  </div>

                                  <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4">
                                    <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">
                                      Tracking timeline
                                    </div>
                                    {(detail.trackingHistory || []).length ? (
                                      <div className="mt-4 grid gap-3">
                                        {[...(detail.trackingHistory || [])]
                                          .slice(-6)
                                          .reverse()
                                          .map((entry, index) => (
                                            <div
                                              key={`${detail._id}-track-${index}`}
                                              className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3"
                                            >
                                              <div className="text-sm font-semibold text-slate-100">
                                                {entry.status || "Updated"}
                                              </div>
                                              <div className="mt-1 text-xs text-slate-500">
                                                {formatDateTime(entry.time || entry.timestamp)}
                                              </div>
                                              {entry.note ? (
                                                <div className="mt-2 text-xs leading-6 text-slate-400">
                                                  {entry.note}
                                                </div>
                                              ) : null}
                                            </div>
                                          ))}
                                      </div>
                                    ) : (
                                      <div className="mt-4 text-sm leading-6 text-slate-500">
                                        Tracking history will appear here after the first
                                        fulfilment movement.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <ConsoleEmptyState
                title="No owned website orders found"
                text="Once customers place orders for your published bulk-manufacturing products, they will appear here."
              />
            )}
          </ConsolePanel>

          <div className="grid gap-6">
            <ConsolePanel
              title="Filtered result set"
              subtitle="Quick commercial reading of the currently visible ledger."
            >
              <div className="grid gap-3">
                <DetailBlock
                  label="Total revenue"
                  value={formatCurrency(summary.totalRevenue || 0)}
                />
                <DetailBlock
                  label="Open vs delivered"
                  value={`${formatNumber(summary.openOrders || 0)} open | ${formatNumber(summary.deliveredOrders || 0)} delivered`}
                />
                <DetailBlock
                  label="Payment mix"
                  value={`${formatNumber(summary.paidOrders || 0)} paid | ${formatNumber(summary.pendingPaymentOrders || 0)} pending`}
                />
                <DetailBlock
                  label="Average order value"
                  value={formatCurrency(summary.averageOrderValue || 0)}
                />
              </div>
            </ConsolePanel>

            <ConsolePanel
              title="Working notes"
              subtitle="How this desk behaves inside the ownership model."
            >
              <div className="grid gap-3 text-sm leading-6 text-slate-500">
                <p>
                  Only website orders linked to your bulk-manufacturing-owned
                  products show up here.
                </p>
                <p>
                  Mixed-owner carts are blocked during checkout, so each order in
                  this desk should belong to a single fulfilment owner.
                </p>
                <p>
                  Use the status controls to move genuine manufacturing-owned
                  fulfilment forward without touching franchise or general orders.
                </p>
              </div>
            </ConsolePanel>
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}
