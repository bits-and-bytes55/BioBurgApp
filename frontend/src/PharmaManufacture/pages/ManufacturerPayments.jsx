import React, { useEffect, useState } from "react";
import manufacturerApi from "../manufacturerApi";
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
  formatDateTime,
  formatNumber,
} from "../../Franchise/components/consoleUi";

const getOrderIdLabel = (order) =>
  order?.orderId ||
  order?.invoiceNumber ||
  String(order?._id || "").slice(-8).toUpperCase();

const getPaymentTone = (status) => {
  if (status === "PAID") return "green";
  if (status === "FAILED") return "rose";
  return "amber";
};

const getStatusTone = (status) => {
  if (status === "DELIVERED") return "green";
  if (status === "CANCELLED") return "rose";
  if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(status)) return "blue";
  return "amber";
};

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-100">{value}</span>
    </div>
  );
}

export default function ManufacturerPayments() {
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [summary, setSummary] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const response = await manufacturerApi.get("/manufacturer/payments/summary", {
        params: nextFilters,
      });

      setSummary(response.data.summary || {});
      setRecentOrders(response.data.recentOrders || []);
    } catch (fetchError) {
      console.error("Manufacturer payment summary error:", fetchError);
      setError(
        fetchError.response?.data?.message ||
          "Unable to load manufacturer payment summary.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary({ from: "", to: "" });
  }, []);

  if (loading) {
    return <ConsoleLoading label="Loading manufacturer collections summary..." />;
  }

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          eyebrow="Manufacturer Payments"
          title="Collections and settlement visibility for manufacturer-owned orders."
          description="Read how much revenue your published catalog is generating, how much has already been collected, and which orders are still waiting on payment completion."
          badges={
            <>
              <ConsoleBadge tone="green">
                {formatCurrency(summary.collectedAmount || 0)} collected
              </ConsoleBadge>
              <ConsoleBadge tone="amber">
                {formatCurrency(summary.outstandingAmount || 0)} outstanding
              </ConsoleBadge>
              <ConsoleBadge tone="blue">
                {formatNumber(summary.totalOrders || 0)} orders
              </ConsoleBadge>
            </>
          }
          actions={
            <ConsoleButton variant="secondary" onClick={() => fetchSummary(filters)}>
              Refresh
            </ConsoleButton>
          }
        />

        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <ConsolePanel
          title="Period filter"
          subtitle="Use an optional date range when you want to inspect a specific billing window."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <label className="grid gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                From
              </span>
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
            </label>

            <label className="grid gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                To
              </span>
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
            </label>

            <div className="flex items-end gap-2">
              <ConsoleButton onClick={() => fetchSummary(filters)}>
                Apply
              </ConsoleButton>
              <ConsoleButton
                variant="secondary"
                onClick={() => {
                  const next = { from: "", to: "" };
                  setFilters(next);
                  fetchSummary(next);
                }}
              >
                Reset
              </ConsoleButton>
            </div>
          </div>
        </ConsolePanel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ConsoleMetricCard
            label="Total Revenue"
            primary={formatCurrency(summary.totalRevenue || 0)}
            secondary={`${formatNumber(summary.totalOrders || 0)} website orders`}
            accent
          />
          <ConsoleMetricCard
            label="Collected"
            primary={formatCurrency(summary.collectedAmount || 0)}
            secondary={`${formatNumber(summary.paidOrders || 0)} paid orders`}
          />
          <ConsoleMetricCard
            label="Outstanding"
            primary={formatCurrency(summary.outstandingAmount || 0)}
            secondary={`${formatNumber(summary.pendingPaymentOrders || 0)} awaiting payment`}
          />
          <ConsoleMetricCard
            label="Settlement Ready"
            primary={formatCurrency(summary.settlementReadyAmount || 0)}
            secondary={`${formatNumber(summary.deliveredOrders || 0)} delivered orders`}
          />
          <ConsoleMetricCard
            label="Average Order Value"
            primary={formatCurrency(summary.averageOrderValue || 0)}
            secondary={`${formatNumber(summary.onlineOrders || 0)} online | ${formatNumber(summary.codOrders || 0)} COD`}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <ConsolePanel
            title="Recent commercial activity"
            subtitle="Latest manufacturer-owned orders with payment and fulfilment states."
          >
            {recentOrders.length ? (
              <div className="grid gap-4">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(14,20,26,0.92),rgba(8,12,17,0.9))] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="console-mono text-xs font-bold tracking-[0.16em] text-slate-400">
                          {getOrderIdLabel(order)}
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-100">
                          {order.userId?.name || order.address?.fullName || "Customer"}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                          {formatDateTime(order.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-amber-400">
                          {formatCurrency(order.totalAmount || 0)}
                        </div>
                        <div className="mt-2 flex flex-wrap justify-end gap-2">
                          <ConsoleBadge tone={getPaymentTone(order.paymentStatus)}>
                            {order.paymentStatus || "-"}
                          </ConsoleBadge>
                          <ConsoleBadge tone={getStatusTone(order.orderStatus)}>
                            {order.orderStatus || "-"}
                          </ConsoleBadge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm leading-6 text-slate-500">
                      {(order.items || [])
                        .map((item) => item.name || item.productId?.brandName || "Product")
                        .join(" | ") || "No items snapshot available"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ConsoleEmptyState
                title="No payment activity yet"
                text="Once customers place manufacturer-owned website orders, this ledger will start showing live commercial activity."
              />
            )}
          </ConsolePanel>

          <div className="grid gap-6">
            <ConsolePanel
              title="Commercial breakdown"
              subtitle="Fast read of how revenue is currently distributed."
            >
              <div className="grid gap-3">
                <DetailRow
                  label="Paid vs pending"
                  value={`${formatNumber(summary.paidOrders || 0)} paid | ${formatNumber(summary.pendingPaymentOrders || 0)} pending`}
                />
                <DetailRow
                  label="Failed payments"
                  value={formatNumber(summary.failedPaymentOrders || 0)}
                />
                <DetailRow
                  label="Online vs COD"
                  value={`${formatNumber(summary.onlineOrders || 0)} online | ${formatNumber(summary.codOrders || 0)} COD`}
                />
                <DetailRow
                  label="Open fulfilment"
                  value={formatNumber(summary.openOrders || 0)}
                />
                <DetailRow
                  label="Cancelled orders"
                  value={formatNumber(summary.cancelledOrders || 0)}
                />
              </div>
            </ConsolePanel>

            <ConsolePanel
              title="Reading guide"
              subtitle="How to interpret these metrics for your manufacturer account."
            >
              <div className="grid gap-3 text-sm leading-6 text-slate-500">
                <p>
                  Collected amount is based on orders already marked as paid in the
                  website checkout flow.
                </p>
                <p>
                  Outstanding amount tracks unpaid orders still attached to your
                  manufacturer-owned catalog.
                </p>
                <p>
                  Settlement-ready value tracks delivered orders, helping you see
                  which revenue has operationally matured.
                </p>
              </div>
            </ConsolePanel>
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}
