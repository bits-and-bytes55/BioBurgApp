import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  formatCurrency,
  formatDate,
  formatNumber,
} from "../components/consoleUi";

const orderStatusTone = (status) => {
  if (status === "DELIVERED") return "green";
  if (status === "CANCELLED" || status === "REJECTED") return "rose";
  if (status === "PACKED" || status === "SHIPPED") return "blue";
  return "amber";
};

const inventoryTone = (status) => {
  if (status === "OUT_OF_STOCK") return "rose";
  if (status === "LOW_STOCK") return "amber";
  if (status === "BELOW_TARGET") return "blue";
  return "green";
};

const supportTone = (status) => {
  if (status === "RESOLVED") return "green";
  if (status === "IN_PROGRESS") return "blue";
  return "amber";
};

function SnapshotRow({ label, value, helper, tone = "neutral" }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{helper}</div>
      <div className="mt-3">
        <ConsoleBadge tone={tone}>{label} live</ConsoleBadge>
      </div>
    </div>
  );
}

function MiniListCard({ title, items, emptyTitle, emptyText, renderItem, action }) {
  return (
    <ConsolePanel title={title} action={action}>
      {items.length ? (
        <div className="grid gap-3">
          {items.map(renderItem)}
        </div>
      ) : (
        <ConsoleEmptyState title={emptyTitle} text={emptyText} />
      )}
    </ConsolePanel>
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await franchiseApi.get("/franchise/dashboard");
      setDashboard(response.data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load franchise dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <ConsolePage>
        <ConsoleLoading label="Loading franchise dashboard..." />
      </ConsolePage>
    );
  }

  if (error) {
    return (
      <ConsolePage>
        <ConsoleNotice tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <ConsoleButton onClick={fetchDashboard}>Retry</ConsoleButton>
          </div>
        </ConsoleNotice>
      </ConsolePage>
    );
  }

  const account = dashboard?.account || {};
  const metrics = dashboard?.metrics || {};
  const zone = account.zone || null;
  const paymentSummary = dashboard?.paymentSummary || {};
  const supportSummary = dashboard?.supportSummary || {};
  const inventorySummary = dashboard?.inventorySummary || {};
  const alerts = dashboard?.alerts || {};
  const recentOrders = dashboard?.recentOrders || [];
  const recentSupportTickets = dashboard?.recentSupportTickets || [];
  const recentRestockRequests = dashboard?.recentRestockRequests || [];
  const lowStockItems = dashboard?.lowStockItems || [];
  const statusData = dashboard?.orderStatusData || [];
  const salesTrend = dashboard?.salesTrend || [];

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          title="Operations Dashboard"
          description={`${account.application?.fullName || account.email || "Franchise"} ${
            zone?.name ? `for ${zone.name}` : "without an assigned zone"
          }. Monitor payout visibility, order flow, support pressure, and stock health from one command surface.`}
          badges={
            <>
              <ConsoleBadge tone={account.status === "ACTIVE" ? "green" : "amber"}>
                Account {account.status || "UNKNOWN"}
              </ConsoleBadge>
              <ConsoleBadge tone={zone?.status === "ACTIVE" ? "blue" : "neutral"}>
                {zone?.name || "Zone pending"}
              </ConsoleBadge>
              <ConsoleBadge tone={alerts.urgentActions ? "amber" : "neutral"}>
                {formatNumber(alerts.urgentActions || 0)} urgent actions
              </ConsoleBadge>
            </>
          }
          actions={
            <>
              <ConsoleButton onClick={() => navigate("/franchise/products?create=1")}>
                Add Product
              </ConsoleButton>
              <ConsoleButton
                variant="secondary"
                onClick={() => navigate("/franchise/orders")}
              >
                Orders
              </ConsoleButton>
              <ConsoleButton
                variant="secondary"
                onClick={() => navigate("/franchise/products")}
              >
                Products
              </ConsoleButton>
              <ConsoleButton
                variant="secondary"
                onClick={() => navigate("/franchise/inventory")}
              >
                Inventory
              </ConsoleButton>
              <ConsoleButton
                variant="secondary"
                onClick={() => navigate("/franchise/payments")}
              >
                Payments
              </ConsoleButton>
              <ConsoleButton variant="secondary" onClick={fetchDashboard}>
                Refresh
              </ConsoleButton>
            </>
          }
        />

        {!zone ? (
          <ConsoleNotice tone="warning">
            This franchise account is active, but no zone is assigned yet. Orders,
            payouts, and inventory will stay empty until admin maps a working zone.
          </ConsoleNotice>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ConsoleMetricCard
            label="Total Orders"
            primary={formatNumber(metrics.totalOrders)}
            secondary={`${formatNumber(metrics.pendingOrders)} still in the pipeline`}
          />
          <ConsoleMetricCard
            label="Today's Orders"
            primary={formatNumber(metrics.todayOrders)}
            secondary={`${formatNumber(metrics.activeDeliveries)} deliveries currently moving`}
          />
          <ConsoleMetricCard
            label="Net Payout Due"
            primary={formatCurrency(paymentSummary.netPayoutDue)}
            secondary={`${formatNumber(paymentSummary.settlementEligibleOrders)} orders cleared hold`}
            accent
          />
          <ConsoleMetricCard
            label="Stock Alerts"
            primary={formatNumber(
              (inventorySummary.lowStockItems || 0) +
                (inventorySummary.outOfStockItems || 0),
            )}
            secondary={`${formatNumber(inventorySummary.activeRestockRequests)} restock requests open`}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_360px]">
              <ConsolePanel
                title="Revenue trend"
                subtitle="Last 7 days sales movement for this franchise zone"
              >
                {salesTrend.length ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                        <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            background: "#0d0e12",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 14,
                            color: "#e2e8f0",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#f59e0b" }}
                          activeDot={{ r: 5, fill: "#fbbf24" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <ConsoleEmptyState
                    title="No trend data yet"
                    text="Revenue graph will appear once zone orders start landing."
                  />
                )}
              </ConsolePanel>

              <ConsolePanel
                title="Live summary"
                subtitle="Zone, support, payout, and stock snapshot"
              >
                <div className="grid gap-3">
                  <SnapshotRow
                    label="Zone"
                    value={zone?.name || "Pending"}
                    helper={`${zone?.pincodes?.length || 0} pincodes mapped`}
                    tone="blue"
                  />
                  <SnapshotRow
                    label="Support Queue"
                    value={formatNumber(supportSummary.open)}
                    helper={`${formatNumber(supportSummary.inProgress)} currently in progress`}
                    tone="amber"
                  />
                  <SnapshotRow
                    label="Low Stock"
                    value={formatNumber(inventorySummary.lowStockItems)}
                    helper={`${formatNumber(inventorySummary.outOfStockItems)} fully out of stock`}
                    tone="rose"
                  />
                  <SnapshotRow
                    label="Eligible Settlement"
                    value={formatCurrency(paymentSummary.settlementEligibleAmount)}
                    helper={`${formatNumber(paymentSummary.settlementEligibleOrders)} paid orders cleared`}
                    tone="green"
                  />
                </div>
              </ConsolePanel>
            </div>

            <ConsolePanel
              title="Order status breakdown"
              subtitle="Current pipeline mix across the franchise zone"
            >
              {statusData.length ? (
                <div className="grid gap-3">
                  {statusData.map((item) => {
                    const maxValue = Math.max(
                      ...statusData.map((entry) => Number(entry.value || 0)),
                      1,
                    );
                    const width = Math.max(
                      (Number(item.value || 0) / maxValue) * 100,
                      Number(item.value || 0) ? 10 : 0,
                    );

                    return (
                      <div key={item.name}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm text-slate-400">{item.name}</span>
                          <span className="console-mono text-sm font-semibold text-slate-200">
                            {formatNumber(item.value)}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ConsoleEmptyState
                  title="No orders tracked yet"
                  text="Order status bars will appear once the zone has activity."
                />
              )}
            </ConsolePanel>

            <ConsolePanel
              title="Recent orders"
              subtitle="Latest order activity in your assigned zone"
              action={
                <ConsoleButton
                  variant="secondary"
                  onClick={() => navigate("/franchise/orders")}
                >
                  View all
                </ConsoleButton>
              }
            >
              {recentOrders.length ? (
                <div className="overflow-x-auto">
                  <table className="franchise-console-table min-w-full text-sm">
                    <thead>
                      <tr>
                        {["Order", "Customer", "Status", "Amount", "Action"].map((header) => (
                          <th
                            key={header}
                            className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order._id}>
                          <td className="border-t border-white/[0.05] px-4 py-3 align-top">
                            <div className="console-mono text-xs font-bold tracking-[0.16em] text-slate-200">
                              #{String(order._id).slice(-8).toUpperCase()}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="border-t border-white/[0.05] px-4 py-3 align-top">
                            <div className="font-semibold text-slate-100">
                              {order.userId?.name || order.address?.fullName || "N/A"}
                            </div>
                          </td>
                          <td className="border-t border-white/[0.05] px-4 py-3 align-top">
                            <ConsoleBadge tone={orderStatusTone(order.orderStatus)}>
                              {order.orderStatus}
                            </ConsoleBadge>
                          </td>
                          <td className="border-t border-white/[0.05] px-4 py-3 align-top console-mono font-semibold text-amber-400">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="border-t border-white/[0.05] px-4 py-3 align-top">
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
              ) : (
                <ConsoleEmptyState
                  title="No recent orders"
                  text="Orders will show here once the franchise zone receives activity."
                />
              )}
            </ConsolePanel>

            <ConsolePanel
              title="Low stock watchlist"
              subtitle="Products that need replenishment or closer monitoring"
              action={
                <ConsoleBadge tone={lowStockItems.length ? "amber" : "green"}>
                  {formatNumber(lowStockItems.length)} items
                </ConsoleBadge>
              }
            >
              {lowStockItems.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.productId}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-100">
                            {item.productName}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Current {formatNumber(item.currentStock)} • Target{" "}
                            {formatNumber(item.targetStock)}
                          </div>
                        </div>
                        <ConsoleBadge tone={inventoryTone(item.stockStatus)}>
                          {item.stockStatus.replaceAll("_", " ")}
                        </ConsoleBadge>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-slate-400 sm:grid-cols-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                            Threshold
                          </div>
                          <div className="mt-1 font-semibold text-slate-200">
                            {formatNumber(item.lowStockThreshold)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                            Need
                          </div>
                          <div className="mt-1 font-semibold text-slate-200">
                            {formatNumber(item.recommendedRestockQty)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                            Request
                          </div>
                          <div className="mt-1 font-semibold text-slate-200">
                            {item.activeRestockRequest
                              ? item.activeRestockRequest.status
                              : "Raise now"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ConsoleEmptyState
                  title="Stock looks healthy"
                  text="No low-stock or out-of-stock products need attention right now."
                />
              )}
            </ConsolePanel>
          </div>

          <div className="grid gap-6">
            <ConsolePanel
              title="Operations attention"
              subtitle="Critical signals and zone detail summary"
            >
              <div className="grid gap-3">
                <ConsoleNotice tone={alerts.outOfStockItems ? "error" : "info"}>
                  {formatNumber(alerts.outOfStockItems)} out-of-stock products need
                  immediate action.
                </ConsoleNotice>
                <ConsoleNotice tone={alerts.lowStockItems ? "warning" : "info"}>
                  {formatNumber(alerts.lowStockItems)} products are below threshold.
                </ConsoleNotice>
                <ConsoleNotice
                  tone={alerts.openSupportTickets ? "warning" : "success"}
                >
                  {formatNumber(alerts.openSupportTickets)} support tickets are open.
                </ConsoleNotice>
                <ConsoleNotice
                  tone={alerts.pendingCollectionOrders ? "warning" : "success"}
                >
                  {formatNumber(alerts.pendingCollectionOrders)} delivered orders are
                  still pending collection.
                </ConsoleNotice>
              </div>

              <div className="mt-5 border-t border-white/[0.06] pt-5">
                <div className="mb-3 text-xs uppercase tracking-[0.26em] text-slate-600">
                  Zone details
                </div>
                <div className="grid gap-3 text-sm text-slate-400">
                  <div>
                    Zone: <span className="font-semibold text-slate-100">{zone?.name || "-"}</span>
                  </div>
                  <div>
                    Email: <span className="font-semibold text-slate-100">{account.email || "-"}</span>
                  </div>
                  <div>
                    Locality: <span className="font-semibold text-slate-100">{account.application?.locality || "-"}</span>
                  </div>
                  <div>
                    City of interest:{" "}
                    <span className="font-semibold text-slate-100">
                      {account.application?.citiesOfInterest || "-"}
                    </span>
                  </div>
                  <div>
                    Pincodes:{" "}
                    <span className="font-semibold text-slate-100">
                      {zone?.pincodes?.length ? zone.pincodes.join(", ") : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </ConsolePanel>

            <ConsolePanel
              title="Payments and support snapshot"
              subtitle="Collections, payout, and support pressure"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SnapshotRow
                  label="Paid Collections"
                  value={formatCurrency(paymentSummary.paidAmount)}
                  helper={`${formatNumber(paymentSummary.paidOrders)} paid orders`}
                  tone="green"
                />
                <SnapshotRow
                  label="Pending Value"
                  value={formatCurrency(paymentSummary.pendingAmount)}
                  helper={`${formatNumber(paymentSummary.pendingPaymentOrders)} unsettled`}
                  tone="amber"
                />
                <SnapshotRow
                  label="Net Payout Due"
                  value={formatCurrency(paymentSummary.netPayoutDue)}
                  helper={`${formatNumber(paymentSummary.settlementEligibleOrders)} cleared`}
                  tone="blue"
                />
                <SnapshotRow
                  label="Support Queue"
                  value={formatNumber(supportSummary.open)}
                  helper={`${formatNumber(supportSummary.inProgress)} in progress`}
                  tone="amber"
                />
              </div>
            </ConsolePanel>

            <MiniListCard
              title="Recent restock requests"
              action={
                <ConsoleButton
                  variant="secondary"
                  onClick={() => navigate("/franchise/inventory")}
                >
                  Inventory
                </ConsoleButton>
              }
              items={recentRestockRequests}
              emptyTitle="No recent restock requests"
              emptyText="Once stock requests are raised, they will appear here."
              renderItem={(request) => (
                <div
                  key={request._id}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-100">{request.productName}</div>
                    <ConsoleBadge tone={request.status === "FULFILLED" ? "green" : "blue"}>
                      {request.status}
                    </ConsoleBadge>
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    Qty {formatNumber(request.requestedQty)} • Priority {request.priority}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Raised on {formatDate(request.createdAt)}
                  </div>
                </div>
              )}
            />

            <MiniListCard
              title="Recent support tickets"
              action={
                <ConsoleButton
                  variant="secondary"
                  onClick={() => navigate("/franchise/support")}
                >
                  Support
                </ConsoleButton>
              }
              items={recentSupportTickets}
              emptyTitle="No support activity yet"
              emptyText="Ticket conversation history will appear here once support is used."
              renderItem={(ticket) => (
                <div
                  key={ticket._id}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-100">{ticket.subject}</div>
                    <ConsoleBadge tone={supportTone(ticket.status)}>
                      {ticket.status}
                    </ConsoleBadge>
                  </div>
                  <div className="mt-2 text-sm text-slate-400">{ticket.category}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Updated on {formatDate(ticket.updatedAt || ticket.createdAt)}
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}
