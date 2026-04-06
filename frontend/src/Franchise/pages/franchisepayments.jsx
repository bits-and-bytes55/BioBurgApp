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

const buildDateParams = (from, to) => (from && to ? { from, to } : {});

const getSettlementState = (order, holdCutoffDate) => {
  if (["CANCELLED", "REJECTED"].includes(order.orderStatus)) {
    return { label: "Cancelled", tone: "rose" };
  }

  if (order.orderStatus !== "DELIVERED") {
    return { label: "In pipeline", tone: "neutral" };
  }

  if (order.paymentStatus !== "PAID") {
    return { label: "Collection pending", tone: "amber" };
  }

  const deliveredAt = new Date(order.deliveredAt || order.createdAt);
  const holdCutoff = holdCutoffDate ? new Date(holdCutoffDate) : null;

  if (holdCutoff && deliveredAt <= holdCutoff) {
    return { label: "Eligible", tone: "green" };
  }

  return { label: "In hold", tone: "blue" };
};

function RuleBadge({ label, value, tone = "neutral" }) {
  return <ConsoleBadge tone={tone}>{label}: {value}</ConsoleBadge>;
}

function BreakdownRow({ label, value, helper, accent = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-white/[0.05] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div>
        <div className="text-sm text-slate-300">{label}</div>
        {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
      </div>
      <div
        className={`console-mono text-sm font-bold ${
          accent ? "text-amber-400" : "text-slate-100"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function FranchisePayments() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [orders, setOrders] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchPayments = async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, ordersRes] = await Promise.all([
        franchiseApi.get("/franchise/reports/settlement-summary", { params }),
        franchiseApi.get("/franchise/reports/sales", { params }),
      ]);

      setSummary(summaryRes.data.summary || {});
      setOrders(ordersRes.data.orders || []);
    } catch (err) {
      console.error("Payments fetch error", err);
      setError(err.response?.data?.message || "Unable to load payments data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const applyFilters = () => fetchPayments(buildDateParams(from, to));
  const resetFilters = () => {
    setFrom("");
    setTo("");
    fetchPayments();
  };

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          title="Payments & Settlement"
          description="Track payout eligibility, commission deductions, hold periods, and the order ledger that drives settlement calculations."
          badges={
            <>
              <RuleBadge
                label="Commission"
                value={`${summary?.rules?.commissionRate ?? 12}%`}
                tone="amber"
              />
              <RuleBadge
                label="Hold"
                value={`${summary?.rules?.settlementHoldDays ?? 7} days`}
                tone="blue"
              />
              <RuleBadge
                label="Min payout"
                value={formatCurrency(summary?.rules?.minimumPayoutAmount)}
                tone="green"
              />
              {summary?.holdCutoffDate ? (
                <RuleBadge
                  label="Hold cutoff"
                  value={new Date(summary.holdCutoffDate).toLocaleDateString("en-IN")}
                />
              ) : null}
            </>
          }
          actions={
            <>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111318] px-3 py-2">
                <span className="console-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
                  From
                </span>
                <input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="bg-transparent text-xs text-slate-300 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111318] px-3 py-2">
                <span className="console-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
                  To
                </span>
                <input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="bg-transparent text-xs text-slate-300 outline-none"
                />
              </div>
              <ConsoleButton onClick={applyFilters}>Apply</ConsoleButton>
              <ConsoleButton variant="secondary" onClick={resetFilters}>
                Reset
              </ConsoleButton>
            </>
          }
        />

        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <div className="flex w-fit gap-1 rounded-xl border border-white/[0.06] bg-[#111318] p-1">
          {[
            { id: "overview", label: "Overview" },
            { id: "ledger", label: "Payment Ledger" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <ConsoleLoading label="Loading settlement data..." />
        ) : activeTab === "overview" ? (
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ConsoleMetricCard
                label="Gross Collections"
                primary={formatCurrency(summary?.totalCollections)}
                secondary="All order value in your zone"
              />
              <ConsoleMetricCard
                label="Paid Amount"
                primary={formatCurrency(summary?.paidAmount)}
                secondary={`${summary?.paidOrders || 0} delivered paid orders`}
              />
              <ConsoleMetricCard
                label="Eligible Settlement"
                primary={formatCurrency(summary?.settlementEligibleAmount)}
                secondary={`${summary?.settlementEligibleOrders || 0} orders cleared hold`}
              />
              <ConsoleMetricCard
                label="Commission"
                primary={formatCurrency(summary?.commissionAmount)}
                secondary="Deducted from eligible base"
              />
              <ConsoleMetricCard
                label="Net Payout Due"
                primary={formatCurrency(summary?.netPayoutDue)}
                secondary="After commission"
                accent
              />
              <ConsoleMetricCard
                label="In Hold"
                primary={formatCurrency(summary?.settlementInHoldAmount)}
                secondary={`${summary?.settlementInHoldOrders || 0} paid orders waiting`}
              />
              <ConsoleMetricCard
                label="Pending Collection"
                primary={formatCurrency(summary?.deliveredPendingCollection)}
                secondary={`${summary?.deliveredPendingCollectionOrders || 0} delivered unpaid`}
              />
              <ConsoleMetricCard
                label="Threshold Hold"
                primary={formatCurrency(summary?.belowThresholdAmount)}
                secondary="Held until minimum payout is reached"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
              <ConsolePanel
                title="Settlement breakdown"
                subtitle="Projected net payout and commission split"
              >
                <div className="grid gap-2">
                  <BreakdownRow
                    label="Total delivered paid orders"
                    value={formatCurrency(summary?.deliveredPaidValue)}
                  />
                  <BreakdownRow
                    label={`Commission @ ${summary?.rules?.commissionRate ?? 12}%`}
                    value={`- ${formatCurrency(summary?.projectedCommissionAmount)}`}
                    helper="Deducted before payout"
                  />
                  <BreakdownRow
                    label="Projected net settlement"
                    value={formatCurrency(summary?.projectedNetSettlement)}
                    accent
                  />
                </div>

                <div className="mt-5">
                  <div className="mb-2 text-xs text-slate-500">Net vs commission split</div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                    {(() => {
                      const total =
                        Number(summary?.projectedNetSettlement || 0) +
                        Number(summary?.projectedCommissionAmount || 0);
                      const netPct = total
                        ? (Number(summary?.projectedNetSettlement || 0) / total) * 100
                        : 0;
                      const commissionPct = total ? 100 - netPct : 0;

                      return (
                        <>
                          <div
                            className="h-full rounded-l-full bg-amber-500 transition-all duration-700"
                            style={{ width: `${netPct}%` }}
                          />
                          <div
                            className="h-full rounded-r-full bg-slate-600 transition-all duration-700"
                            style={{ width: `${commissionPct}%` }}
                          />
                        </>
                      );
                    })()}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span>Net payout</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-600" />
                      <span>Commission</span>
                    </div>
                  </div>
                </div>
              </ConsolePanel>

              <ConsolePanel
                title="Settlement notes"
                subtitle="How the payout numbers are calculated"
              >
                <div className="grid gap-3">
                  <ConsoleNotice tone="info">
                    Settlement is calculated on delivered and paid orders after the
                    configured hold period.
                  </ConsoleNotice>
                  <ConsoleNotice tone="warning">
                    Orders that are delivered but not paid remain in pending
                    collection and do not contribute to payout.
                  </ConsoleNotice>
                  <ConsoleNotice tone="success">
                    Commission is deducted before net payout becomes due.
                  </ConsoleNotice>
                </div>
              </ConsolePanel>
            </div>
          </div>
        ) : (
          <ConsolePanel
            title="Payment ledger"
            subtitle={`${orders.length} ledger row${orders.length === 1 ? "" : "s"} in the current period`}
          >
            {orders.length === 0 ? (
              <ConsoleEmptyState
                title="No ledger rows found"
                text="Try another date range or wait for new order activity."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="franchise-console-table min-w-full text-sm">
                  <thead>
                    <tr>
                      {[
                        "Order ID",
                        "Date",
                        "Mode",
                        "Payment",
                        "Order Status",
                        "Settlement",
                        "Amount",
                        "Action",
                      ].map((header) => (
                        <th key={header} className={consoleTableHeadClass}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const settlement = getSettlementState(order, summary?.holdCutoffDate);
                      return (
                        <tr key={order._id}>
                          <td className={consoleTableCellClass}>
                            <span className="console-mono text-xs font-bold tracking-[0.16em] text-slate-200">
                              #{String(order._id).slice(-8).toUpperCase()}
                            </span>
                          </td>
                          <td className={`${consoleTableCellClass} text-slate-500`}>
                            {formatDate(order.createdAt)}
                          </td>
                          <td className={consoleTableCellClass}>
                            <span className="console-mono text-xs text-slate-300">
                              {order.paymentMode || "-"}
                            </span>
                          </td>
                          <td className={consoleTableCellClass}>
                            <ConsoleBadge
                              tone={
                                order.paymentStatus === "PAID"
                                  ? "green"
                                  : order.paymentStatus === "FAILED"
                                    ? "rose"
                                    : "amber"
                              }
                            >
                              {order.paymentStatus || "PENDING"}
                            </ConsoleBadge>
                          </td>
                          <td className={consoleTableCellClass}>
                            <span className="text-slate-400">{order.orderStatus || "-"}</span>
                          </td>
                          <td className={consoleTableCellClass}>
                            <ConsoleBadge tone={settlement.tone}>
                              {settlement.label}
                            </ConsoleBadge>
                          </td>
                          <td className={`${consoleTableCellClass} console-mono font-bold text-amber-400`}>
                            {formatCurrency(order.totalAmount)}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ConsolePanel>
        )}
      </div>
    </ConsolePage>
  );
}
