import React, { useEffect, useMemo, useState } from "react";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import adminFranchiseApi from "./adminFranchiseApi";
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
  adminTableSx,
  formatCurrency,
  formatDate,
} from "./adminFranchiseUi";

const paymentTone = (status) => (status === "PAID" ? "green" : "amber");

export default function FranchiseSalesReports() {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [settlementSummary, setSettlementSummary] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const [summaryResponse, salesResponse, settlementResponse] =
        await Promise.all([
          adminFranchiseApi.get("/admin/franchise/reports/summary", { params }),
          adminFranchiseApi.get("/admin/franchise/reports/sales", { params }),
          adminFranchiseApi.get("/admin/franchise/reports/settlements", {
            params,
          }),
        ]);

      setSummary(summaryResponse.data || {});
      setOrders(salesResponse.data.orders || []);
      setSettlementSummary(settlementResponse.data.summary || {});
      setSettlements(settlementResponse.data.settlements || []);
    } catch (err) {
      console.error("Franchise sales report fetch failed", err);
      setError(err.response?.data?.message || "Unable to load franchise reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const applyFilters = () => {
    fetchReports(from && to ? { from, to } : {});
  };

  const dateLabel = useMemo(() => {
    if (from && to) return `${formatDate(from)} to ${formatDate(to)}`;
    return "All available periods";
  }, [from, to]);

  if (loading) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading franchise reports..." />
      </AdminFranchisePage>
    );
  }

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title="Sales & Settlement Visibility"
          description="Read franchise performance, compare rule-driven settlements, and inspect the order ledger without leaving the super admin panel."
          badges={
            <>
              <AdminFranchiseBadge tone="blue">{dateLabel}</AdminFranchiseBadge>
              <AdminFranchiseBadge tone="gold">
                {settlementSummary?.totalFranchiseAccounts || 0} accounts
              </AdminFranchiseBadge>
              <AdminFranchiseBadge tone="green">
                {summary?.totalOrders || 0} orders
              </AdminFranchiseBadge>
            </>
          }
          actions={
            <>
              <AdminFranchiseButton variant="secondary" onClick={applyFilters}>
                Apply Filters
              </AdminFranchiseButton>
              <AdminFranchiseButton variant="secondary" onClick={() => fetchReports()}>
                Refresh
              </AdminFranchiseButton>
            </>
          }
        />

        {error ? <AdminFranchiseNotice tone="error">{error}</AdminFranchiseNotice> : null}
        <AdminFranchiseNotice tone="success">
          Settlements are calculated from explicit rules. Delivered and paid orders
          become eligible only after each franchise account clears its configured
          hold period, then commission is deducted before payout becomes due.
        </AdminFranchiseNotice>

        <AdminFranchisePanel
          title="Filter Console"
          subtitle="Run a quick date-window comparison for sales and payout exposure."
          action={
            <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap" }}>
              <TextField
                type="date"
                label="From"
                InputLabelProps={{ shrink: true }}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                sx={adminFieldSx}
              />
              <TextField
                type="date"
                label="To"
                InputLabelProps={{ shrink: true }}
                value={to}
                onChange={(event) => setTo(event.target.value)}
                sx={adminFieldSx}
              />
            </Box>
          }
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.1 }}>
            <AdminFranchiseBadge tone="blue">
              Accounts {settlementSummary?.totalFranchiseAccounts || 0}
            </AdminFranchiseBadge>
            <AdminFranchiseBadge tone="green">
              Active {settlementSummary?.activeAccounts || 0}
            </AdminFranchiseBadge>
            <AdminFranchiseBadge tone="rose">
              Blocked {settlementSummary?.blockedAccounts || 0}
            </AdminFranchiseBadge>
            <AdminFranchiseBadge tone="gold">
              Orders {summary?.totalOrders || 0}
            </AdminFranchiseBadge>
          </Box>
        </AdminFranchisePanel>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          <AdminFranchiseMetric label="Gross Sales" value={formatCurrency(summary?.totalSales)} helper={`${summary?.totalOrders || 0} total franchise orders`} />
          <AdminFranchiseMetric label="Settlement Eligible" value={formatCurrency(settlementSummary?.settlementEligibleAmount)} helper="Delivered, paid, and outside hold window" />
          <AdminFranchiseMetric label="Commission Due" value={formatCurrency(settlementSummary?.commissionAmount)} helper="Calculated from each account's rule" />
          <AdminFranchiseMetric label="Net Payout Due" value={formatCurrency(settlementSummary?.netPayoutDue)} helper="Eligible after commission deduction" accent />
          <AdminFranchiseMetric label="In Hold" value={formatCurrency(settlementSummary?.settlementInHoldAmount)} helper="Delivered and paid but still locked" />
          <AdminFranchiseMetric label="Pending Collection" value={formatCurrency(settlementSummary?.deliveredPendingCollection)} helper="Delivered orders not yet marked paid" />
          <AdminFranchiseMetric label="Below Threshold" value={formatCurrency(settlementSummary?.belowThresholdAmount)} helper="Eligible net held by minimum payout rule" />
          <AdminFranchiseMetric label="Projected Net" value={formatCurrency(settlementSummary?.projectedNetSettlement)} helper="Projected post-commission settlement" />
        </Box>

        <AdminFranchisePanel
          title="Settlement Snapshot"
          subtitle="Per-franchise breakdown of the current settlement position and rule impact."
        >
          <Box sx={{ overflowX: "auto" }}>
            {!settlements.length ? (
              <AdminFranchiseEmpty
                title="No settlements found"
                text="No franchise settlements are available for the selected period."
              />
            ) : (
              <Table sx={adminTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Franchise</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Rules</TableCell>
                    <TableCell>Paid Base</TableCell>
                    <TableCell>Eligible Base</TableCell>
                    <TableCell>Commission</TableCell>
                    <TableCell>Net Payout</TableCell>
                    <TableCell>In Hold</TableCell>
                    <TableCell>Pending Collection</TableCell>
                    <TableCell>Threshold Hold</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.accountId}>
                      <TableCell>
                        <Box sx={{ fontWeight: 800 }}>{settlement.franchiseName}</Box>
                        <Box sx={{ color: "#8da0ad", fontSize: 13, mt: 0.6 }}>
                          {settlement.email}
                        </Box>
                      </TableCell>
                      <TableCell>{settlement.zoneName || "-"}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "grid", gap: 0.8 }}>
                          <AdminFranchiseBadge tone="blue">
                            {settlement.settlementConfig?.commissionRate ?? 12}% commission
                          </AdminFranchiseBadge>
                          <AdminFranchiseBadge tone="gold">
                            {settlement.settlementConfig?.settlementHoldDays ?? 7} hold days
                          </AdminFranchiseBadge>
                          <AdminFranchiseBadge tone="neutral">
                            Min {formatCurrency(settlement.settlementConfig?.minimumPayoutAmount)}
                          </AdminFranchiseBadge>
                        </Box>
                      </TableCell>
                      <TableCell>{formatCurrency(settlement.deliveredPaidValue)}</TableCell>
                      <TableCell>{formatCurrency(settlement.settlementEligibleAmount)}</TableCell>
                      <TableCell>{formatCurrency(settlement.commissionAmount)}</TableCell>
                      <TableCell>{formatCurrency(settlement.netPayoutDue)}</TableCell>
                      <TableCell>{formatCurrency(settlement.settlementInHoldAmount)}</TableCell>
                      <TableCell>{formatCurrency(settlement.deliveredPendingCollection)}</TableCell>
                      <TableCell>{formatCurrency(settlement.belowThresholdAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </AdminFranchisePanel>

        <AdminFranchisePanel
          title="Sales Orders Ledger"
          subtitle="Review the source transactions behind the summary and settlement cards."
        >
          <Box sx={{ overflowX: "auto" }}>
            {!orders.length ? (
              <AdminFranchiseEmpty
                title="No orders in ledger"
                text="No franchise orders were found for the selected period."
              />
            ) : (
              <Table sx={adminTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Mode</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Order Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>#{String(order._id).slice(-6).toUpperCase()}</TableCell>
                      <TableCell>{order.zoneId?.name || "-"}</TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone="neutral">
                          {order.paymentMode || "-"}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={paymentTone(order.paymentStatus)}>
                          {order.paymentStatus || "PENDING"}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>{order.orderStatus || "-"}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </AdminFranchisePanel>
      </Box>
    </AdminFranchisePage>
  );
}
