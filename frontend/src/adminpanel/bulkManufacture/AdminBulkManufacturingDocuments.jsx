import React, { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  AdminFranchiseNotice,
  AdminFranchisePage,
  AdminFranchisePanel,
  adminDialogPaperSx,
  adminFieldSx,
  formatDate,
  formatNumber,
} from "../franchise/adminFranchiseUi";

const reviewStatuses = ["ALL", "PENDING", "VERIFIED", "ISSUES_FOUND"];

const getTone = (value) => {
  if (value === "VERIFIED") {
    return "green";
  }

  if (value === "ISSUES_FOUND") {
    return "rose";
  }

  return "amber";
};

export default function AdminBulkManufacturingDocuments() {
  const [data, setData] = useState({ requests: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reviewStatus, setReviewStatus] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({
    documentReviewStatus: "PENDING",
    documentReviewNotes: "",
    reviewNotes: "",
    rejectionReason: "",
  });

  const fetchDocuments = async (nextStatus = reviewStatus, nextSearch = search) => {
    try {
      setLoading(true);
      setError("");
      const response = await adminBulkManufacturingApi.get("/documents", {
        params: {
          documentReviewStatus: nextStatus,
          search: nextSearch,
        },
      });
      setData(response.data);
    } catch (documentsError) {
      console.error("Admin bulk documents fetch error:", documentsError);
      setError(
        documentsError.response?.data?.message ||
          "Unable to load documents desk.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const openDialog = (request) => {
    setSelectedRequest(request);
    setForm({
      documentReviewStatus: request.documentReviewStatus || "PENDING",
      documentReviewNotes: request.documentReviewNotes || "",
      reviewNotes: request.reviewNotes || "",
      rejectionReason: request.rejectionReason || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async (status) => {
    if (!selectedRequest?._id) {
      return;
    }

    try {
      setSaving(true);
      const response = await adminBulkManufacturingApi.patch(
        `/requests/${selectedRequest._id}/status`,
        {
          status,
          ...form,
        },
      );
      if (response.data.credentials) {
        setCredentials(response.data.credentials);
      }
      setDialogOpen(false);
      await fetchDocuments(reviewStatus, search);
    } catch (saveError) {
      console.error("Admin bulk documents save error:", saveError);
      setError(
        saveError.response?.data?.message ||
          "Unable to update document review.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminFranchiseLoading label="Loading documents verification desk..." />;
  }

  return (
    <AdminFranchisePage>
      <AdminFranchiseHero
        eyebrow="Documents Verification"
        title="Review bulk manufacturing compliance documents with cleaner verification controls."
        description="Track uploaded document completeness, add review notes, and move applications forward once the file set is acceptable."
        actions={
          <AdminFranchiseButton variant="secondary" onClick={() => fetchDocuments()}>
            Refresh documents
          </AdminFranchiseButton>
        }
        badges={[
          <AdminFranchiseBadge key="total" tone="gold">
            {formatNumber(data.summary?.total)} applications
          </AdminFranchiseBadge>,
          <AdminFranchiseBadge key="verified" tone="green">
            {formatNumber(data.summary?.verified)} verified
          </AdminFranchiseBadge>,
          <AdminFranchiseBadge key="issues" tone="rose">
            {formatNumber(data.summary?.issues)} flagged
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

      <Box sx={{ mt: 2.5 }}>
        <AdminFranchisePanel
          title="Document Queue"
          subtitle="Focus on uploaded compliance files and missing required document sets."
          action={
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                size="small"
                placeholder="Search applicant or company"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ ...adminFieldSx, minWidth: 240 }}
              />
              <TextField
                select
                size="small"
                value={reviewStatus}
                onChange={(event) => setReviewStatus(event.target.value)}
                sx={{ ...adminFieldSx, minWidth: 180 }}
              >
                {reviewStatuses.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <AdminFranchiseButton
                variant="secondary"
                onClick={() => fetchDocuments(reviewStatus, search)}
              >
                Apply
              </AdminFranchiseButton>
            </Stack>
          }
        >
          {data.requests?.length === 0 ? (
            <AdminFranchiseEmpty
              title="No document records found"
              text="Once applicants upload files, they will appear in this verification queue."
            />
          ) : (
            <Stack spacing={1.5}>
              {data.requests.map((request) => (
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
                    <Box sx={{ maxWidth: 900 }}>
                      <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                        {request.companyName}
                      </Typography>
                      <Typography sx={{ mt: 0.8, color: "#8da0ad", lineHeight: 1.75 }}>
                        {request.fullName} • {request.email} • Submitted {formatDate(request.createdAt)}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                        <AdminFranchiseBadge tone={getTone(request.documentReviewStatus)}>
                          {request.documentReviewStatus}
                        </AdminFranchiseBadge>
                        <AdminFranchiseBadge tone="blue">
                          {request.documentSummary?.uploadedCount || 0} docs uploaded
                        </AdminFranchiseBadge>
                        {request.documentSummary?.missingRequiredDocuments?.length ? (
                          <AdminFranchiseBadge tone="rose">
                            Missing {request.documentSummary.missingRequiredDocuments.length}
                          </AdminFranchiseBadge>
                        ) : (
                          <AdminFranchiseBadge tone="green">
                            Required set complete
                          </AdminFranchiseBadge>
                        )}
                      </Stack>
                    </Box>

                    <Stack direction={{ xs: "row", lg: "column" }} spacing={1}>
                      <AdminFranchiseButton
                        variant="secondary"
                        onClick={() => openDialog(request)}
                      >
                        Verify documents
                      </AdminFranchiseButton>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </AdminFranchisePanel>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: adminDialogPaperSx }}
      >
        <DialogTitle>Document Review</DialogTitle>
        <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {selectedRequest ? (
            <Stack spacing={2}>
              <Typography sx={{ color: "#8da0ad", lineHeight: 1.8 }}>
                {selectedRequest.companyName} • {selectedRequest.fullName}
              </Typography>

              <TextField
                select
                label="Document Review Status"
                value={form.documentReviewStatus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    documentReviewStatus: event.target.value,
                  }))
                }
                fullWidth
                sx={adminFieldSx}
              >
                {reviewStatuses.slice(1).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Document Review Notes"
                value={form.documentReviewNotes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    documentReviewNotes: event.target.value,
                  }))
                }
                fullWidth
                multiline
                rows={3}
                sx={adminFieldSx}
              />

              {selectedRequest.documentSummary?.missingRequiredDocuments?.length ? (
                <AdminFranchiseNotice tone="warning">
                  Missing required documents:{" "}
                  {selectedRequest.documentSummary.missingRequiredDocuments.join(", ")}
                </AdminFranchiseNotice>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)", px: 3, py: 2 }}>
          <AdminFranchiseButton variant="secondary" onClick={() => setDialogOpen(false)}>
            Close
          </AdminFranchiseButton>
          <AdminFranchiseButton
            variant="secondary"
            onClick={() => handleSave("UNDER_REVIEW")}
            disabled={saving}
          >
            Save & hold review
          </AdminFranchiseButton>
          <AdminFranchiseButton
            onClick={() => handleSave("APPROVED")}
            disabled={saving}
          >
            Approve request
          </AdminFranchiseButton>
        </DialogActions>
      </Dialog>
    </AdminFranchisePage>
  );
}
