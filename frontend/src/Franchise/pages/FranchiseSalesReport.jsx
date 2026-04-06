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
} from "../components/consoleUi";

const statusOptions = [
  "ALL",
  "PLACED",
  "ACCEPTED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
];
const paymentModes = ["ALL", "COD", "ONLINE"];
const paymentStatuses = ["ALL", "PENDING", "PAID", "FAILED"];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount_high", label: "High to Low" },
  { value: "amount_low", label: "Low to High" },
];
const defaultFilters = {
  search: "",
  status: "ALL",
  paymentMode: "ALL",
  paymentStatus: "ALL",
  from: "",
  to: "",
  sortBy: "newest",
};

const getStatusTone = (status) => {
  if (status === "DELIVERED") return "green";
  if (status === "CANCELLED" || status === "REJECTED") return "rose";
  if (status === "SHIPPED") return "blue";
  if (status === "PACKED" || status === "ACCEPTED" || status === "PLACED") {
    return "amber";
  }
  return "neutral";
};

const exportSalesCsv = (orders) => {
  if (!orders.length) return;

  const rows = orders.map((order) => ({
    order_id: String(order._id || "").slice(-8).toUpperCase(),
    invoice_number: order.invoiceNumber || "",
    customer_name: order.userId?.name || "",
    customer_phone: order.userId?.phone || "",
    order_status: order.orderStatus || "",
    payment_mode: order.paymentMode || "",
    payment_status: order.paymentStatus || "",
    zone: order.zoneId?.name || "",
    amount: Number(order.totalAmount || 0),
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "",
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

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `franchise-sales-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

function FilterPill({ label, options, value, onChange, isSelect = false }) {
  return (
    <div className="grid gap-2">
      <label className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
        {label}
      </label>
      {isSelect ? (
        <select className={consoleInputClass} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((option) => (
            <option
              key={typeof option === "string" ? option : option.value}
              value={typeof option === "string" ? option : option.value}
            >
              {typeof option === "string" ? option : option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => {
            const optionValue = typeof option === "string" ? option : option.value;
            const optionLabel = typeof option === "string" ? option : option.label;

            return (
              <button
                key={optionValue}
                type="button"
                onClick={() => onChange(optionValue)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                  value === optionValue
                    ? "border-amber-500 bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                    : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200"
                }`}
              >
                {optionLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FranchiseSales() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultFilters);
  const [summary, setSummary] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const fetchReport = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const response = await franchiseApi.get("/franchise/reports/sales", {
        params: nextFilters,
      });
      setSummary(response.data.summary || {});
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error("Sales report fetch error", err);
      setError(err.response?.data?.message || "Unable to load sales report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(defaultFilters);
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const applyFilters = () => fetchReport(filters);
  const resetFilters = () => {
    setFilters(defaultFilters);
    fetchReport(defaultFilters);
  };

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          title="Sales & Revenue"
          description="Review the filtered sales ledger for your franchise zone, export current views, and open any order for detailed fulfilment review."
          badges={
            <>
              <ConsoleBadge tone="blue">{orders.length} rows in current view</ConsoleBadge>
              <ConsoleBadge tone="amber">{summary?.deliveredOrders || 0} delivered</ConsoleBadge>
              <ConsoleBadge tone="green">{summary?.invoiceReadyOrders || 0} invoice ready</ConsoleBadge>
            </>
          }
          actions={
            <>
              <ConsoleButton
                variant="secondary"
                onClick={() => exportSalesCsv(orders)}
                disabled={!orders.length}
              >
                Export CSV
              </ConsoleButton>
              <ConsoleButton onClick={applyFilters}>Refresh</ConsoleButton>
            </>
          }
        />

        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ConsoleMetricCard
            label="Total Orders"
            primary={Number(summary?.totalOrders || 0).toLocaleString("en-IN")}
            secondary={`${summary?.deliveredOrders || 0} delivered • ${summary?.pendingOrders || 0} active`}
          />
          <ConsoleMetricCard
            label="Total Revenue"
            primary={formatCurrency(summary?.totalRevenue)}
            secondary={`Avg. order ${formatCurrency(summary?.averageOrderValue)}`}
            accent
          />
          <ConsoleMetricCard
            label="Paid Revenue"
            primary={formatCurrency(summary?.paidRevenue)}
            secondary={`${summary?.paidOrders || 0} orders marked paid`}
          />
          <ConsoleMetricCard
            label="Invoice Ready"
            primary={Number(summary?.invoiceReadyOrders || 0).toLocaleString("en-IN")}
            secondary={`${summary?.codOrders || 0} COD • ${summary?.onlineOrders || 0} Online`}
          />
        </div>

        <ConsolePanel
          title="Filters & sort"
          subtitle="Narrow the report by customer, invoice, status, payment mode, or date range"
          action={
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              className="text-sm font-semibold text-slate-400 transition-colors hover:text-slate-200"
            >
              {filtersOpen ? "Collapse" : "Expand"}
            </button>
          }
        >
          {filtersOpen ? (
            <div className="grid gap-5">
              <div className="grid gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Customer, order ID, invoice..."
                  value={filters.search}
                  onChange={(event) => handleFilterChange("search", event.target.value)}
                  className={consoleInputClass}
                />
              </div>

              <FilterPill
                label="Order Status"
                options={statusOptions}
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
              />
              <FilterPill
                label="Payment Mode"
                options={paymentModes}
                value={filters.paymentMode}
                onChange={(value) => handleFilterChange("paymentMode", value)}
              />
              <FilterPill
                label="Payment Status"
                options={paymentStatuses}
                value={filters.paymentStatus}
                onChange={(value) => handleFilterChange("paymentStatus", value)}
              />

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                    From
                  </label>
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(event) => handleFilterChange("from", event.target.value)}
                    className={consoleInputClass}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                    To
                  </label>
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(event) => handleFilterChange("to", event.target.value)}
                    className={consoleInputClass}
                  />
                </div>
                <FilterPill
                  label="Sort By"
                  options={sortOptions}
                  value={filters.sortBy}
                  onChange={(value) => handleFilterChange("sortBy", value)}
                  isSelect
                />
              </div>

              <div className="flex gap-2">
                <ConsoleButton onClick={applyFilters}>Apply Filters</ConsoleButton>
                <ConsoleButton variant="secondary" onClick={resetFilters}>
                  Reset
                </ConsoleButton>
              </div>
            </div>
          ) : null}
        </ConsolePanel>

        <ConsolePanel
          title="Sales ledger"
          subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"} match the current filters`}
        >
          {loading ? (
            <ConsoleLoading label="Loading sales report..." />
          ) : orders.length === 0 ? (
            <ConsoleEmptyState
              title="No sales rows found"
              text="Try relaxing filters or wait for order activity in the zone."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="franchise-console-table min-w-full text-sm">
                <thead>
                  <tr>
                    {["Order", "Customer", "Zone", "Status", "Payment", "Invoice", "Amount", "Date", "Action"].map(
                      (header) => (
                        <th key={header} className={consoleTableHeadClass}>
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className={consoleTableCellClass}>
                        <span className="console-mono text-xs font-bold tracking-[0.16em] text-slate-200">
                          #{String(order._id).slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className={consoleTableCellClass}>
                        <div className="font-semibold text-slate-200 whitespace-nowrap">
                          {order.userId?.name || "N/A"}
                        </div>
                        <div className="console-mono mt-1 text-xs text-slate-500">
                          {order.userId?.phone || "-"}
                        </div>
                      </td>
                      <td className={`${consoleTableCellClass} text-slate-400`}>
                        {order.zoneId?.name || "-"}
                      </td>
                      <td className={consoleTableCellClass}>
                        <ConsoleBadge tone={getStatusTone(order.orderStatus)}>
                          {order.orderStatus || "-"}
                        </ConsoleBadge>
                      </td>
                      <td className={consoleTableCellClass}>
                        <div className="console-mono text-xs text-slate-300">
                          {order.paymentMode || "-"}
                        </div>
                        <div className="mt-2">
                          <ConsoleBadge
                            tone={
                              order.paymentStatus === "PAID"
                                ? "green"
                                : order.paymentStatus === "FAILED"
                                  ? "rose"
                                  : "amber"
                            }
                          >
                            {order.paymentStatus || "-"}
                          </ConsoleBadge>
                        </div>
                      </td>
                      <td className={consoleTableCellClass}>
                        {order.invoiceReady ? (
                          <ConsoleBadge tone="green">
                            {order.invoiceNumber || "Ready"}
                          </ConsoleBadge>
                        ) : (
                          <ConsoleBadge>Pending</ConsoleBadge>
                        )}
                      </td>
                      <td className={`${consoleTableCellClass} console-mono font-bold text-amber-400`}>
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className={`${consoleTableCellClass} text-slate-400`}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td className={consoleTableCellClass}>
                        <ConsoleButton
                          variant="secondary"
                          onClick={() => navigate(`/franchise/orders/${order._id}`)}
                        >
                          Open
                        </ConsoleButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConsolePanel>
      </div>
    </ConsolePage>
  );
}
