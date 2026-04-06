import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import franchiseApi from "../franchiseApi";
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
  consoleTableCellClass,
  consoleTableHeadClass,
  formatCurrency,
  formatDate,
  formatNumber,
} from "../components/consoleUi";

const ORDER_STATUSES = [
  "ALL",
  "PLACED",
  "ACCEPTED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
];
const PAYMENT_MODES = ["ALL", "COD", "ONLINE"];
const PAYMENT_STATES = ["ALL", "PENDING", "PAID", "FAILED"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount_high", label: "Highest amount" },
  { value: "amount_low", label: "Lowest amount" },
];

const DEFAULT_FILTERS = {
  search: "",
  status: "ALL",
  paymentMode: "ALL",
  paymentStatus: "ALL",
  from: "",
  to: "",
  sortBy: "newest",
};

const statusTone = (status) => {
  if (status === "DELIVERED") return "green";
  if (status === "CANCELLED" || status === "REJECTED") return "rose";
  if (status === "PACKED" || status === "SHIPPED") return "blue";
  return "amber";
};

const paymentTone = (status) => {
  if (status === "PAID") return "green";
  if (status === "FAILED") return "rose";
  return "amber";
};

const activeFilterCount = (filters) => {
  let count = 0;
  if (filters.search) count += 1;
  if (filters.status !== "ALL") count += 1;
  if (filters.paymentMode !== "ALL") count += 1;
  if (filters.paymentStatus !== "ALL") count += 1;
  if (filters.from) count += 1;
  if (filters.to) count += 1;
  return count;
};

const exportOrdersToCsv = (orders) => {
  if (!orders.length) return;

  const rows = orders.map((order) => ({
    order_id: order.orderId || String(order._id || "").slice(-8).toUpperCase(),
    invoice_number: order.invoiceNumber || "",
    customer_name: order.userId?.name || order.address?.fullName || "",
    customer_phone: order.userId?.phone || order.address?.phone || "",
    order_status: order.orderStatus || "",
    payment_mode: order.paymentMode || "",
    payment_status: order.paymentStatus || "",
    total_amount: Number(order.totalAmount || 0),
    date: order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-IN")
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

  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    ),
    download: `franchise-orders-${new Date().toISOString().slice(0, 10)}.csv`,
  });

  link.click();
  URL.revokeObjectURL(link.href);
};

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

function MobileOrderCard({ order, navigate }) {
  return (
    <div
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      onClick={() => navigate(`/franchise/orders/${order._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          navigate(`/franchise/orders/${order._id}`);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="console-mono text-xs font-bold tracking-[0.16em] text-slate-300">
            #{String(order._id).slice(-8).toUpperCase()}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-100">
            {order.userId?.name || order.address?.fullName || "N/A"}
          </div>
        </div>
        <div className="console-mono text-sm font-bold text-amber-400">
          {formatCurrency(order.totalAmount)}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ConsoleBadge tone={statusTone(order.orderStatus)}>
          {order.orderStatus || "-"}
        </ConsoleBadge>
        <ConsoleBadge tone={paymentTone(order.paymentStatus)}>
          {order.paymentStatus || "-"}
        </ConsoleBadge>
        <ConsoleBadge tone="neutral">{order.paymentMode || "-"}</ConsoleBadge>
      </div>

      <div className="mt-3 text-sm text-slate-500">
        {order.invoiceReady ? order.invoiceNumber || "Invoice ready" : "Invoice pending"} •{" "}
        {order.items?.length || 0} items • {formatDate(order.createdAt)}
      </div>

      <div className="mt-4">
        <ConsoleButton
          variant="secondary"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/franchise/orders/${order._id}`);
          }}
        >
          Open order
        </ConsoleButton>
      </div>
    </div>
  );
}

export default function FranchiseOrders() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const response = await franchiseApi.get("/franchise/orders", {
        params: nextFilters,
      });
      setOrders(response.data.orders || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load franchise orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(DEFAULT_FILTERS);
  }, []);

  const updateFilter = (field, value) =>
    setFilters((current) => ({ ...current, [field]: value }));

  const applyFilters = () => fetchOrders(filters);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    fetchOrders(DEFAULT_FILTERS);
  };

  const currentFilterCount = activeFilterCount(filters);

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          title="Orders & Fulfilment"
          description="Track the order pipeline for your zone, refine by payment or status, and open any order for invoice and fulfilment actions."
          badges={
            <>
              <ConsoleBadge tone="blue">{formatNumber(orders.length)} orders loaded</ConsoleBadge>
              <ConsoleBadge tone={currentFilterCount ? "amber" : "neutral"}>
                {currentFilterCount} active filters
              </ConsoleBadge>
            </>
          }
          actions={
            <>
              <ConsoleButton onClick={() => exportOrdersToCsv(orders)} disabled={!orders.length}>
                Export CSV
              </ConsoleButton>
              <ConsoleButton variant="secondary" onClick={applyFilters}>
                Apply filters
              </ConsoleButton>
              <ConsoleButton variant="secondary" onClick={resetFilters}>
                Reset
              </ConsoleButton>
            </>
          }
        />

        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ConsoleMetricCard
            label="Filtered Orders"
            primary={formatNumber(summary.totalOrders || 0)}
            secondary={`${formatNumber(summary.deliveredOrders || 0)} delivered`}
          />
          <ConsoleMetricCard
            label="Revenue"
            primary={formatCurrency(summary.totalRevenue)}
            secondary={`Avg ${formatCurrency(summary.averageOrderValue)}`}
            accent
          />
          <ConsoleMetricCard
            label="Invoice Ready"
            primary={formatNumber(summary.invoiceReadyOrders || 0)}
            secondary="Printable invoices available"
          />
          <ConsoleMetricCard
            label="Paid Orders"
            primary={formatNumber(summary.paidOrders || 0)}
            secondary={`${formatNumber(summary.codOrders || 0)} COD orders`}
          />
        </div>

        <ConsolePanel
          title="Filter console"
          subtitle="Search by order, invoice, customer, phone, pincode, or product name"
          action={
            <ConsoleBadge tone={currentFilterCount ? "amber" : "neutral"}>
              {currentFilterCount} active
            </ConsoleBadge>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[2fr_repeat(6,minmax(0,1fr))]">
            <FilterField label="Search">
              <input
                className={consoleInputClass}
                placeholder="Order, invoice, customer, phone..."
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && applyFilters()}
              />
            </FilterField>

            <FilterField label="Status">
              <select
                className={consoleInputClass}
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
              >
                {ORDER_STATUSES.map((status) => (
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
                onChange={(event) => updateFilter("paymentMode", event.target.value)}
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Payment status">
              <select
                className={consoleInputClass}
                value={filters.paymentStatus}
                onChange={(event) => updateFilter("paymentStatus", event.target.value)}
              >
                {PAYMENT_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Sort by">
              <select
                className={consoleInputClass}
                value={filters.sortBy}
                onChange={(event) => updateFilter("sortBy", event.target.value)}
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
                onChange={(event) => updateFilter("from", event.target.value)}
              />
            </FilterField>

            <FilterField label="To">
              <input
                className={consoleInputClass}
                type="date"
                value={filters.to}
                onChange={(event) => updateFilter("to", event.target.value)}
              />
            </FilterField>
          </div>

          {currentFilterCount > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {filters.search ? (
                <ConsoleBadge tone="neutral">Search: {filters.search}</ConsoleBadge>
              ) : null}
              {filters.status !== "ALL" ? (
                <ConsoleBadge tone="amber">Status: {filters.status}</ConsoleBadge>
              ) : null}
              {filters.paymentMode !== "ALL" ? (
                <ConsoleBadge tone="blue">Mode: {filters.paymentMode}</ConsoleBadge>
              ) : null}
              {filters.paymentStatus !== "ALL" ? (
                <ConsoleBadge tone="green">
                  Payment: {filters.paymentStatus}
                </ConsoleBadge>
              ) : null}
              {filters.from ? (
                <ConsoleBadge tone="neutral">From: {filters.from}</ConsoleBadge>
              ) : null}
              {filters.to ? (
                <ConsoleBadge tone="neutral">To: {filters.to}</ConsoleBadge>
              ) : null}
            </div>
          ) : null}
        </ConsolePanel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_340px]">
          <ConsolePanel
            title="Order ledger"
            subtitle="Open any order to review invoice, tracking, and fulfilment actions"
            action={
              <div className="text-sm text-slate-500">
                {formatNumber(orders.length)} result{orders.length === 1 ? "" : "s"}
              </div>
            }
          >
            {loading ? (
              <ConsoleLoading label="Loading franchise orders..." />
            ) : orders.length === 0 ? (
              <ConsoleEmptyState
                title="No orders found"
                text="Try adjusting filters or wait for new order activity in the zone."
              />
            ) : (
              <>
                <div className="grid gap-3 md:hidden">
                  {orders.map((order) => (
                    <MobileOrderCard key={order._id} order={order} navigate={navigate} />
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="franchise-console-table min-w-full text-sm">
                    <thead>
                      <tr>
                        {[
                          "Order",
                          "Customer",
                          "Status",
                          "Payment",
                          "Invoice",
                          "Amount",
                          "Date",
                          "Action",
                        ].map((header) => (
                          <th key={header} className={consoleTableHeadClass}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order._id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/franchise/orders/${order._id}`)}
                        >
                          <td className={consoleTableCellClass}>
                            <div className="console-mono text-xs font-bold tracking-[0.16em] text-slate-200">
                              #{String(order._id).slice(-8).toUpperCase()}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {order.items?.length || 0} items
                            </div>
                          </td>
                          <td className={`${consoleTableCellClass} min-w-[200px]`}>
                            <div className="font-semibold text-slate-100">
                              {order.userId?.name || order.address?.fullName || "N/A"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {order.userId?.email || order.address?.phone || "-"}
                            </div>
                          </td>
                          <td className={consoleTableCellClass}>
                            <ConsoleBadge tone={statusTone(order.orderStatus)}>
                              {order.orderStatus || "-"}
                            </ConsoleBadge>
                          </td>
                          <td className={`${consoleTableCellClass} min-w-[140px]`}>
                            <div className="text-sm text-slate-200">
                              {order.paymentMode || "-"}
                            </div>
                            <div className="mt-2">
                              <ConsoleBadge tone={paymentTone(order.paymentStatus)}>
                                {order.paymentStatus || "-"}
                              </ConsoleBadge>
                            </div>
                          </td>
                          <td className={`${consoleTableCellClass} min-w-[140px]`}>
                            {order.invoiceReady ? (
                              <ConsoleBadge tone="green">
                                {order.invoiceNumber || "Ready"}
                              </ConsoleBadge>
                            ) : (
                              <ConsoleBadge tone="neutral">Pending</ConsoleBadge>
                            )}
                          </td>
                          <td className={`${consoleTableCellClass} console-mono font-bold text-amber-400`}>
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className={`${consoleTableCellClass} text-slate-500`}>
                            {formatDate(order.createdAt)}
                          </td>
                          <td className={consoleTableCellClass}>
                            <ConsoleButton
                              variant="secondary"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/franchise/orders/${order._id}`);
                              }}
                            >
                              Open
                            </ConsoleButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </ConsolePanel>

          <div className="grid gap-6">
            <ConsolePanel
              title="Result set summary"
              subtitle="Quick overview of the currently filtered orders"
            >
              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-600">
                    Delivered vs pipeline
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-100">
                    {formatNumber(summary.deliveredOrders || 0)} /{" "}
                    {formatNumber(summary.pendingOrders || 0)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-600">
                    Paid revenue
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-100">
                    {formatCurrency(summary.paidRevenue)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-600">
                    Online revenue
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-100">
                    {formatCurrency(summary.onlineRevenue)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-600">
                    COD revenue
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-100">
                    {formatCurrency(summary.codRevenue)}
                  </div>
                </div>
              </div>
            </ConsolePanel>

            <ConsolePanel title="Working notes" subtitle="How to use this ledger efficiently">
              <div className="grid gap-3 text-sm leading-6 text-slate-500">
                <p>
                  Search supports order ID, invoice number, customer name, phone,
                  pincode, and product names.
                </p>
                <p>
                  CSV export follows the currently applied filters, so refine the
                  list before downloading.
                </p>
                <p>
                  Open any order to update fulfilment status and print an invoice
                  once it is ready.
                </p>
              </div>
            </ConsolePanel>
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}
