import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
  adminDialogPaperSx,
  adminFieldSx,
  formatDate,
  formatDateTime,
  formatNumber,
} from "../franchise/adminFranchiseUi";

const modeConfig = {
  pending: {
    title: "Pending & Under Review Requests",
    description:
      "Review fresh applications, validate documents, and decide which applicants should move into the approved bulk manufacturing partner pool.",
    defaultStatus: "PENDING",
    statuses: ["PENDING", "UNDER_REVIEW"],
  },
  approved: {
    title: "Approved Partners & Portal Access",
    description:
      "Monitor approved applications, review provisioned accounts, and regenerate credentials when a partner needs access support.",
    defaultStatus: "APPROVED",
    statuses: ["APPROVED"],
  },
  all: {
    title: "All Bulk Manufacturing Requests",
    description:
      "A full review ledger covering pending, approved, and rejected bulk manufacturing applications.",
    defaultStatus: "ALL",
    statuses: ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
  },
};

const documentStatuses = ["PENDING", "VERIFIED", "ISSUES_FOUND"];

const getTone = (status) => {
  if (["APPROVED", "VERIFIED", "ACTIVE"].includes(status)) {
    return "green";
  }

  if (["REJECTED", "ISSUES_FOUND", "BLOCKED"].includes(status)) {
    return "rose";
  }

  if (["UNDER_REVIEW"].includes(status)) {
    return "blue";
  }

  return "amber";
};

export default function AdminBulkManufacturingRequests({ mode = "all" }) {
  const config = modeConfig[mode] || modeConfig.all;
  const [requestsData, setRequestsData] = useState({ requests: [], summary: {} });
  const [accountsData, setAccountsData] = useState({ accounts: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(config.defaultStatus);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    reviewNotes: "",
    rejectionReason: "",
    documentReviewStatus: "PENDING",
    documentReviewNotes: "",
  });
  const [credentials, setCredentials] = useState(null);

  const fetchRequests = async (nextStatus = statusFilter, nextSearch = search) => {
    const params = {
      status: nextStatus,
      search: nextSearch,
    };

    if (mode === "approved") {
      params.documentReviewStatus = "ALL";
    }

    const response = await adminBulkManufacturingApi.get("/requests", { params });
    setRequestsData(response.data);
  };

  const fetchAccounts = async () => {
    if (mode !== "approved") {
      return;
    }

    const response = await adminBulkManufacturingApi.get("/accounts", {
      params: { status: "ALL" },
    });
    setAccountsData(response.data);
  };

  const fetchAll = async (nextStatus = statusFilter, nextSearch = search) => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([
        fetchRequests(nextStatus, nextSearch),
        fetchAccounts(),
      ]);
    } catch (requestsError) {
      console.error("Admin bulk requests load error:", requestsError);
      setError(
        requestsError.response?.data?.message ||
          "Unable to load bulk manufacturing requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(config.defaultStatus, "");
  }, [mode]);

  const metricCards = useMemo(
    () => [
      {
        label: "Total",
        value: formatNumber(requestsData.summary?.total),
        helper: "Overall bulk manufacturing applications in the system",
      },
      {
        label: "Pending",
        value: formatNumber(requestsData.summary?.pending),
        helper: "Fresh submissions waiting for first review",
      },
      {
        label: "Under Review",
        value: formatNumber(requestsData.summary?.underReview),
        helper: "Applications currently being reviewed by admin",
      },
      {
        label: "Approved",
        value: formatNumber(requestsData.summary?.approved),
        helper: "Applications already provisioned for portal access",
      },
    ],
    [requestsData.summary],
  );

  const openDetails = async (requestId) => {
    try {
      const response = await adminBulkManufacturingApi.get(`/requests/${requestId}`);
      setSelectedRequest(response.data.request);
      setReviewForm({
        reviewNotes: response.data.request.reviewNotes || "",
        rejectionReason: response.data.request.rejectionReason || "",
        documentReviewStatus: response.data.request.documentReviewStatus || "PENDING",
        documentReviewNotes: response.data.request.documentReviewNotes || "",
      });
      setDetailDialog(true);
    } catch (detailError) {
      console.error("Admin bulk request detail error:", detailError);
      setError(
        detailError.response?.data?.message ||
          "Unable to load request details.",
      );
    }
  };

  const closeDetailDialog = () => {
    setDetailDialog(false);
    setSelectedRequest(null);
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedRequest?._id) {
      return;
    }

    try {
      setSaving(true);
      const response = await adminBulkManufacturingApi.patch(
        `/requests/${selectedRequest._id}/status`,
        {
          status,
          ...reviewForm,
        },
      );

      if (response.data.credentials) {
        setCredentials(response.data.credentials);
      }

      await fetchAll(statusFilter, search);
      await openDetails(selectedRequest._id);
    } catch (updateError) {
      console.error("Admin bulk request status error:", updateError);
      setError(
        updateError.response?.data?.message ||
          "Unable to update request status.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAccountAction = async (accountId, action, status = "") => {
    try {
      setSaving(true);

      if (action === "reset-password") {
        const response = await adminBulkManufacturingApi.post(
          `/accounts/${accountId}/reset-password`,
        );
        setCredentials(response.data.credentials);
      } else {
        await adminBulkManufacturingApi.patch(`/accounts/${accountId}/status`, {
          status,
        });
      }

      await fetchAccounts();
    } catch (accountError) {
      console.error("Admin bulk account action error:", accountError);
      setError(
        accountError.response?.data?.message ||
          "Unable to update partner account.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminFranchiseLoading label="Loading bulk manufacturing requests..." />;
  }

  return (
    <AdminFranchisePage>
      <AdminFranchiseHero
        eyebrow="Bulk Manufacturing Review"
        title={config.title}
        description={config.description}
        actions={
          <>
            <AdminFranchiseButton variant="secondary" onClick={() => fetchAll()}>
              Refresh desk
            </AdminFranchiseButton>
          </>
        }
        badges={[
          <AdminFranchiseBadge key="status" tone="gold">
            Filter {statusFilter}
          </AdminFranchiseBadge>,
          <AdminFranchiseBadge key="results" tone="blue">
            {formatNumber(requestsData.requests?.length)} visible records
          </AdminFranchiseBadge>,
        ]}
      />

      {error ? (
        <Box sx={{ mt: 3 }}>
          <AdminFranchiseNotice tone="error">{error}</AdminFranchiseNotice>
        </Box>
      ) : null}

      {credentials ? (
        <Box sx={{ mt: 3 }}>
          <AdminFranchiseNotice tone="success">
            Portal credentials ready: username <strong>{credentials.username}</strong>,
            email <strong>{credentials.email}</strong>, temporary password{" "}
            <strong>{credentials.password}</strong>.
          </AdminFranchiseNotice>
        </Box>
      ) : null}

      <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
        {metricCards.map((metric, index) => (
          <Grid item xs={12} sm={6} xl={3} key={metric.label}>
            <AdminFranchiseMetric
              label={metric.label}
              value={metric.value}
              helper={metric.helper}
              accent={index === 0}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 2.5 }}>
        <AdminFranchisePanel
          title="Applications"
          subtitle="Open a request to review documents, add notes, and move the applicant through approval."
          action={
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                size="small"
                placeholder="Search applicant, company, email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ ...adminFieldSx, minWidth: 240 }}
              />
              <TextField
                select
                size="small"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={{ ...adminFieldSx, minWidth: 180 }}
              >
                {config.statuses.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <AdminFranchiseButton
                variant="secondary"
                onClick={() => fetchAll(statusFilter, search)}
              >
                Apply
              </AdminFranchiseButton>
            </Stack>
          }
        >
          {requestsData.requests?.length === 0 ? (
            <AdminFranchiseEmpty
              title="No requests found"
              text="Adjust filters or wait for fresh applicant submissions."
            />
          ) : (
            <Stack spacing={1.5}>
              {requestsData.requests.map((request) => (
                <Box
                  key={request._id}
                  sx={{
                    p: 2.2,
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                  >
                    <Box sx={{ maxWidth: 920 }}>
                      <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                        {request.companyName}
                      </Typography>
                      <Typography sx={{ mt: 0.8, color: "#8da0ad", lineHeight: 1.75 }}>
                        {request.fullName} • {request.email} • {request.mobile}
                      </Typography>
                      <Typography sx={{ mt: 0.8, color: "#8da0ad", lineHeight: 1.75 }}>
                        {request.country} • Requested portal ID {request.requestedUsername || "N/A"}
                      </Typography>
                      <Typography sx={{ mt: 0.8, color: "#d8e2e8", lineHeight: 1.8 }}>
                        {request.products}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                        <AdminFranchiseBadge tone={getTone(request.status)}>
                          {request.status}
                        </AdminFranchiseBadge>
                        <AdminFranchiseBadge tone={getTone(request.documentReviewStatus)}>
                          {request.documentReviewStatus}
                        </AdminFranchiseBadge>
                        <AdminFranchiseBadge tone="neutral">
                          {request.documentSummary?.uploadedCount || 0} docs
                        </AdminFranchiseBadge>
                        <AdminFranchiseBadge tone="neutral">
                          {formatDate(request.createdAt)}
                        </AdminFranchiseBadge>
                      </Stack>
                    </Box>

                    <Stack direction={{ xs: "row", lg: "column" }} spacing={1}>
                      <AdminFranchiseButton
                        variant="secondary"
                        onClick={() => openDetails(request._id)}
                      >
                        Open review
                      </AdminFranchiseButton>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </AdminFranchisePanel>
      </Box>

      {mode === "approved" ? (
        <Box sx={{ mt: 2.5 }}>
          <AdminFranchisePanel
            title="Portal Accounts"
            subtitle="Approved partners already provisioned for the bulk manufacturing portal."
          >
            {accountsData.accounts?.length === 0 ? (
              <AdminFranchiseEmpty
                title="No provisioned accounts"
                text="Approve a request to automatically create a partner login."
              />
            ) : (
              <Stack spacing={1.5}>
                {accountsData.accounts.map((account) => (
                  <Box
                    key={account._id}
                    sx={{
                      p: 2.2,
                      borderRadius: 4,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", lg: "row" }}
                      spacing={2}
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                          {account.companyName}
                        </Typography>
                        <Typography sx={{ mt: 0.8, color: "#8da0ad", lineHeight: 1.75 }}>
                          {account.username} • {account.email}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                          <AdminFranchiseBadge tone={getTone(account.status)}>
                            {account.status}
                          </AdminFranchiseBadge>
                          <AdminFranchiseBadge tone="blue">
                            {account.requestId?.status || "APPROVED"}
                          </AdminFranchiseBadge>
                        </Stack>
                      </Box>

                      <Stack direction={{ xs: "row", lg: "column" }} spacing={1}>
                        <AdminFranchiseButton
                          variant="secondary"
                          onClick={() =>
                            handleAccountAction(
                              account._id,
                              "status",
                              account.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                            )
                          }
                        >
                          {account.status === "ACTIVE" ? "Block account" : "Activate account"}
                        </AdminFranchiseButton>
                        <AdminFranchiseButton
                          variant="secondary"
                          onClick={() =>
                            handleAccountAction(account._id, "reset-password")
                          }
                        >
                          Reset password
                        </AdminFranchiseButton>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </AdminFranchisePanel>
        </Box>
      ) : null}

      <Dialog
        open={detailDialog}
        onClose={closeDetailDialog}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: adminDialogPaperSx }}
      >
        <DialogTitle>Application Review</DialogTitle>
        <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {selectedRequest ? (
            <Grid container spacing={2.2}>
              <Grid item xs={12} lg={7}>
                <Stack spacing={1.8}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                      {selectedRequest.companyName}
                    </Typography>
                    <Typography sx={{ mt: 0.8, color: "#8da0ad", lineHeight: 1.8 }}>
                      {selectedRequest.fullName} • {selectedRequest.email} • {selectedRequest.mobile}
                    </Typography>
                    <Typography sx={{ mt: 0.8, color: "#8da0ad", lineHeight: 1.8 }}>
                      {selectedRequest.country} • {selectedRequest.orgType}
                    </Typography>
                    <Typography sx={{ mt: 1.2, color: "#d8e2e8", lineHeight: 1.8 }}>
                      Products: {selectedRequest.products}
                    </Typography>
                    <Typography sx={{ mt: 0.6, color: "#d8e2e8", lineHeight: 1.8 }}>
                      Qty: {selectedRequest.quantity} • Destination: {selectedRequest.destinationCountry}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: "#edf3f7", mb: 1 }}>
                      Uploaded documents
                    </Typography>
                    {selectedRequest.documentSummary?.uploadedKeys?.length ? (
                      <Stack spacing={1}>
                        {selectedRequest.documentSummary.uploadedKeys.map((key) => (
                          <AdminFranchiseBadge key={key} tone="blue">
                            {key}
                          </AdminFranchiseBadge>
                        ))}
                      </Stack>
                    ) : (
                      <Typography sx={{ color: "#8da0ad" }}>
                        No documents found on this application.
                      </Typography>
                    )}

                    {selectedRequest.documentSummary?.missingRequiredDocuments?.length ? (
                      <Box sx={{ mt: 1.5 }}>
                        <AdminFranchiseNotice tone="warning">
                          Missing required documents:{" "}
                          {selectedRequest.documentSummary.missingRequiredDocuments.join(", ")}
                        </AdminFranchiseNotice>
                      </Box>
                    ) : null}
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} lg={5}>
                <Stack spacing={2}>
                  <TextField
                    select
                    label="Document Review Status"
                    value={reviewForm.documentReviewStatus}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        documentReviewStatus: event.target.value,
                      }))
                    }
                    fullWidth
                    sx={adminFieldSx}
                  >
                    {documentStatuses.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Document Review Notes"
                    value={reviewForm.documentReviewNotes}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        documentReviewNotes: event.target.value,
                      }))
                    }
                    fullWidth
                    multiline
                    rows={3}
                    sx={adminFieldSx}
                  />
                  <TextField
                    label="Review Notes"
                    value={reviewForm.reviewNotes}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        reviewNotes: event.target.value,
                      }))
                    }
                    fullWidth
                    multiline
                    rows={3}
                    sx={adminFieldSx}
                  />
                  <TextField
                    label="Rejection Reason"
                    value={reviewForm.rejectionReason}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        rejectionReason: event.target.value,
                      }))
                    }
                    fullWidth
                    multiline
                    rows={3}
                    sx={adminFieldSx}
                  />
                  <AdminFranchiseNotice tone="info">
                    Created {formatDateTime(selectedRequest.createdAt)} • Current status {selectedRequest.status}
                  </AdminFranchiseNotice>
                </Stack>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)", px: 3, py: 2 }}>
          <AdminFranchiseButton variant="secondary" onClick={closeDetailDialog}>
            Close
          </AdminFranchiseButton>
          <AdminFranchiseButton
            variant="secondary"
            onClick={() => handleStatusUpdate("UNDER_REVIEW")}
            disabled={saving}
          >
            Mark under review
          </AdminFranchiseButton>
          <AdminFranchiseButton
            onClick={() => handleStatusUpdate("APPROVED")}
            disabled={saving}
          >
            Approve & provision
          </AdminFranchiseButton>
          <AdminFranchiseButton
            variant="secondary"
            onClick={() => handleStatusUpdate("REJECTED")}
            disabled={saving}
          >
            Reject
          </AdminFranchiseButton>
        </DialogActions>
      </Dialog>
    </AdminFranchisePage>
  );
}
