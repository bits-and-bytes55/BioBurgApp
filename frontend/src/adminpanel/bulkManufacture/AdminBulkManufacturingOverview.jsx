import React, { useEffect, useState } from "react";
import { Box, Grid, Stack, Typography } from "@mui/material";
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
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "../franchise/adminFranchiseUi";

export default function AdminBulkManufacturingOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminBulkManufacturingApi.get("/overview");
      setData(response.data);
    } catch (overviewError) {
      console.error("Admin bulk overview load error:", overviewError);
      setError(
        overviewError.response?.data?.message ||
          "Unable to load bulk manufacturing overview.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return <AdminFranchiseLoading label="Loading bulk manufacturing overview..." />;
  }

  const summary = data?.summary || {};

  return (
    <AdminFranchisePage>
      <AdminFranchiseHero
        eyebrow="Super Admin Bulk Manufacturing Desk"
        title="A full control view for bulk manufacturing onboarding, accounts, and live requirement flow."
        description="Monitor pending applications, document verification, approved partner accounts, and commercial requirement activity from a single admin workspace."
        actions={
          <AdminFranchiseButton variant="secondary" onClick={fetchOverview}>
            Refresh overview
          </AdminFranchiseButton>
        }
        badges={[
          <AdminFranchiseBadge key="requests" tone="gold">
            {formatNumber(summary.totalRequests)} requests
          </AdminFranchiseBadge>,
          <AdminFranchiseBadge key="accounts" tone="blue">
            {formatNumber(summary.totalAccounts)} portal accounts
          </AdminFranchiseBadge>,
          <AdminFranchiseBadge key="requirements" tone="green">
            {formatNumber(summary.totalRequirements)} requirements
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
          ["Pending Requests", summary.pendingRequests, "Fresh applications waiting for the first review pass"],
          ["Under Review", summary.underReviewRequests, "Requests actively being reviewed by the admin team"],
          ["Approved", summary.approvedRequests, "Applications already converted into eligible partners"],
          ["Rejected", summary.rejectedRequests, "Rejected applications with stored lifecycle notes"],
          ["Verified Documents", summary.verifiedDocuments, "Document sets fully verified by admin"],
          ["Document Issues", summary.issueDocuments, "Applications flagged for missing or problematic files"],
          ["Active Accounts", summary.activeAccounts, "Provisioned partner accounts ready to login"],
          ["Quoted Requirements", summary.quotedRequirements, "Requirements with active quote details"],
          ["Website Orders", summary.totalWebsiteOrders, "Orders already routed to bulk-manufacturing owners"],
          ["Open Order Flow", summary.openWebsiteOrders, "Bulk-owned orders still waiting for fulfilment movement"],
          ["Delivered Orders", summary.deliveredWebsiteOrders, "Bulk-owned website orders completed successfully"],
          ["Order Revenue", formatCurrency(summary.totalOrderRevenue), "Revenue captured from routed bulk-owned orders"],
        ].map(([label, value, helper], index) => (
          <Grid item xs={12} sm={6} xl={3} key={label}>
            <AdminFranchiseMetric
              label={label}
              value={formatNumber(value)}
              helper={helper}
              accent={index === 0}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} xl={6}>
          <AdminFranchisePanel
            title="Recent Applications"
            subtitle="Most recent bulk manufacturing applicants entering the review workflow."
          >
            {data?.recentRequests?.length ? (
              <Stack spacing={1.5}>
                {data.recentRequests.map((request) => (
                  <Box
                    key={request._id}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                      {request.companyName}
                    </Typography>
                    <Typography sx={{ mt: 0.7, color: "#8da0ad", lineHeight: 1.75 }}>
                      {request.fullName} | {request.email}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.4 }}>
                      <AdminFranchiseBadge tone="amber">
                        {request.status}
                      </AdminFranchiseBadge>
                      <AdminFranchiseBadge tone="blue">
                        {request.documentReviewStatus}
                      </AdminFranchiseBadge>
                      <AdminFranchiseBadge tone="neutral">
                        {formatDateTime(request.createdAt)}
                      </AdminFranchiseBadge>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <AdminFranchiseEmpty
                title="No applications yet"
                text="New bulk manufacturing registrations will appear here once applicants start submitting requests."
              />
            )}
          </AdminFranchisePanel>
        </Grid>

        <Grid item xs={12} xl={6}>
          <AdminFranchisePanel
            title="Recent Requirements"
            subtitle="Latest partner-side manufacturing requirements raised after approval."
          >
            {data?.recentRequirements?.length ? (
              <Stack spacing={1.5}>
                {data.recentRequirements.map((item) => (
                  <Box
                    key={item._id}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                      {item.productName}
                    </Typography>
                    <Typography sx={{ mt: 0.7, color: "#8da0ad", lineHeight: 1.75 }}>
                      {item.accountId?.companyName || item.accountId?.email || "Unknown partner"} | Qty {item.quantity}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.4 }}>
                      <AdminFranchiseBadge tone="amber">
                        {item.status}
                      </AdminFranchiseBadge>
                      <AdminFranchiseBadge tone="blue">
                        {item.priority}
                      </AdminFranchiseBadge>
                      <AdminFranchiseBadge tone="neutral">
                        {formatDateTime(item.createdAt)}
                      </AdminFranchiseBadge>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <AdminFranchiseEmpty
                title="No requirements yet"
                text="Requirement activity will start appearing here once approved partners begin using the portal."
              />
            )}
          </AdminFranchisePanel>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2.5 }}>
        <AdminFranchisePanel
          title="Recent Routed Website Orders"
          subtitle="Latest customer orders that were automatically assigned to approved bulk-manufacturing partners."
        >
          {data?.recentOrders?.length ? (
            <Stack spacing={1.5}>
              {data.recentOrders.map((order) => (
                <Box
                  key={order._id}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                    {order.orderId || order.invoiceNumber || String(order._id).slice(-8).toUpperCase()}
                  </Typography>
                  <Typography sx={{ mt: 0.7, color: "#8da0ad", lineHeight: 1.75 }}>
                    {order.bulkManufacturingAccountId?.companyName || order.bulkManufacturingAccountId?.email || "Unknown partner"} | {order.address?.fullName || order.userId?.name || "Customer"} | {formatCurrency(order.totalAmount)}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.4 }}>
                    <AdminFranchiseBadge tone={order.orderStatus === "DELIVERED" ? "green" : order.orderStatus === "CANCELLED" ? "rose" : "amber"}>
                      {order.orderStatus}
                    </AdminFranchiseBadge>
                    <AdminFranchiseBadge tone={order.paymentStatus === "PAID" ? "green" : "amber"}>
                      {order.paymentStatus}
                    </AdminFranchiseBadge>
                    <AdminFranchiseBadge tone="blue">
                      {order.paymentMode || "NA"}
                    </AdminFranchiseBadge>
                    <AdminFranchiseBadge tone="neutral">
                      {formatDateTime(order.createdAt)}
                    </AdminFranchiseBadge>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <AdminFranchiseEmpty
              title="No routed website orders yet"
              text="Once customers order products owned by bulk-manufacturing partners, those routed orders will appear here."
            />
          )}
        </AdminFranchisePanel>
      </Box>
    </AdminFranchisePage>
  );
}
