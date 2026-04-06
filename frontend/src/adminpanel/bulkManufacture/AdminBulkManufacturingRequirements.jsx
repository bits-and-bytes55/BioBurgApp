import React, { useEffect, useState } from "react";
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
  formatNumber,
} from "../franchise/adminFranchiseUi";

const statuses = [
  "ALL",
  "SUBMITTED",
  "UNDER_REVIEW",
  "QUOTED",
  "REVISION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "CLOSED",
];

const getTone = (status) => {
  if (["APPROVED"].includes(status)) {
    return "green";
  }

  if (["REJECTED"].includes(status)) {
    return "rose";
  }

  if (["QUOTED", "UNDER_REVIEW"].includes(status)) {
    return "blue";
  }

  return "amber";
};

export default function AdminBulkManufacturingRequirements() {
  const [data, setData] = useState({ requirements: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [form, setForm] = useState({
    status: "UNDER_REVIEW",
    adminNotes: "",
    currency: "USD",
    unitPrice: 0,
    moq: "",
    leadTimeDays: 0,
    quoteNotes: "",
    quoteDocumentUrl: "",
  });

  const fetchRequirements = async (nextStatus = status, nextSearch = search) => {
    try {
      setLoading(true);
      setError("");
      const response = await adminBulkManufacturingApi.get("/requirements", {
        params: {
          status: nextStatus,
          search: nextSearch,
        },
      });
      setData(response.data);
    } catch (requirementsError) {
      console.error("Admin bulk requirements fetch error:", requirementsError);
      setError(
        requirementsError.response?.data?.message ||
          "Unable to load requirements desk.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const openDialog = (requirement) => {
    setSelectedRequirement(requirement);
    setForm({
      status: requirement.status || "UNDER_REVIEW",
      adminNotes: requirement.adminNotes || "",
      currency: requirement.quote?.currency || "USD",
      unitPrice: requirement.quote?.unitPrice || 0,
      moq: requirement.quote?.moq || "",
      leadTimeDays: requirement.quote?.leadTimeDays || 0,
      quoteNotes: requirement.quote?.quoteNotes || "",
      quoteDocumentUrl: requirement.quote?.quoteDocumentUrl || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRequirement?._id) {
      return;
    }

    try {
      setSaving(true);
      await adminBulkManufacturingApi.patch(
        `/requirements/${selectedRequirement._id}`,
        {
          status: form.status,
          adminNotes: form.adminNotes,
          quote: {
            currency: form.currency,
            unitPrice: Number(form.unitPrice || 0),
            moq: form.moq,
            leadTimeDays: Number(form.leadTimeDays || 0),
            quoteNotes: form.quoteNotes,
            quoteDocumentUrl: form.quoteDocumentUrl,
          },
        },
      );
      setDialogOpen(false);
      await fetchRequirements(status, search);
    } catch (saveError) {
      console.error("Admin bulk requirement save error:", saveError);
      setError(
        saveError.response?.data?.message ||
          "Unable to update requirement.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminFranchiseLoading label="Loading partner requirements..." />;
  }

  return (
    <AdminFranchisePage>
      <AdminFranchiseHero
        eyebrow="Requirements & Products"
        title="Manage live bulk manufacturing requirements, review notes, and commercial quote readiness."
        description="This desk is the operational bridge between approved partner demand and internal quotation / fulfilment workflows."
        actions={
          <AdminFranchiseButton variant="secondary" onClick={() => fetchRequirements()}>
            Refresh requirements
          </AdminFranchiseButton>
        }
      />

      {error ? (
        <Box sx={{ mt: 3 }}>
          <AdminFranchiseNotice tone="error">{error}</AdminFranchiseNotice>
        </Box>
      ) : null}

      <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
        {[
          ["Total", data.summary?.total, "Overall partner requirements"],
          ["Submitted", data.summary?.submitted, "Fresh demand awaiting commercial review"],
          ["Quoted", data.summary?.quoted, "Requirements with active quote details"],
          ["Approved", data.summary?.approved, "Requirements accepted by admin"],
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

      <Box sx={{ mt: 2.5 }}>
        <AdminFranchisePanel
          title="Requirement Pipeline"
          subtitle="Open a requirement to add admin notes, set status, and share quote details."
          action={
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                size="small"
                placeholder="Search product or partner"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ ...adminFieldSx, minWidth: 240 }}
              />
              <TextField
                select
                size="small"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                sx={{ ...adminFieldSx, minWidth: 180 }}
              >
                {statuses.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <AdminFranchiseButton
                variant="secondary"
                onClick={() => fetchRequirements(status, search)}
              >
                Apply
              </AdminFranchiseButton>
            </Stack>
          }
        >
          {data.requirements?.length === 0 ? (
            <AdminFranchiseEmpty
              title="No requirements found"
              text="Approved partners have not submitted any product requirements yet."
            />
          ) : (
            <Stack spacing={1.5}>
              {data.requirements.map((item) => (
                <Box
                  key={item._id}
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
                        {item.productName}
                      </Typography>
                      <Typography sx={{ mt: 0.8, color: "#8da0ad", lineHeight: 1.75 }}>
                        {item.accountId?.companyName || item.accountId?.email || "Unknown partner"} • Qty {item.quantity} • {item.targetCountry || "No target country"}
                      </Typography>
                      <Typography sx={{ mt: 0.8, color: "#8da0ad", lineHeight: 1.75 }}>
                        Priority {item.priority} • Created {formatDate(item.createdAt)}
                      </Typography>
                      {item.quote?.updatedAt ? (
                        <Typography sx={{ mt: 1.2, color: "#d8e2e8", lineHeight: 1.8 }}>
                          Quote: {item.quote.currency || "USD"} {item.quote.unitPrice || 0}
                          {item.quote.moq ? ` • MOQ ${item.quote.moq}` : ""}
                          {item.quote.leadTimeDays ? ` • ${item.quote.leadTimeDays} days` : ""}
                        </Typography>
                      ) : null}
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                        <AdminFranchiseBadge tone={getTone(item.status)}>
                          {item.status}
                        </AdminFranchiseBadge>
                        <AdminFranchiseBadge tone="blue">
                          {item.priority}
                        </AdminFranchiseBadge>
                      </Stack>
                    </Box>
                    <AdminFranchiseButton
                      variant="secondary"
                      onClick={() => openDialog(item)}
                    >
                      Open workflow
                    </AdminFranchiseButton>
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
        <DialogTitle>Requirement Workflow</DialogTitle>
        <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
                fullWidth
                sx={adminFieldSx}
              >
                {statuses.slice(1).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Currency"
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currency: event.target.value }))
                }
                fullWidth
                sx={adminFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Unit Price"
                type="number"
                value={form.unitPrice}
                onChange={(event) =>
                  setForm((current) => ({ ...current, unitPrice: event.target.value }))
                }
                fullWidth
                sx={adminFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="MOQ"
                value={form.moq}
                onChange={(event) =>
                  setForm((current) => ({ ...current, moq: event.target.value }))
                }
                fullWidth
                sx={adminFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Lead Time (days)"
                type="number"
                value={form.leadTimeDays}
                onChange={(event) =>
                  setForm((current) => ({ ...current, leadTimeDays: event.target.value }))
                }
                fullWidth
                sx={adminFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Quote Document URL"
                value={form.quoteDocumentUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    quoteDocumentUrl: event.target.value,
                  }))
                }
                fullWidth
                sx={adminFieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Admin Notes"
                value={form.adminNotes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, adminNotes: event.target.value }))
                }
                fullWidth
                multiline
                rows={3}
                sx={adminFieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Quote Notes"
                value={form.quoteNotes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, quoteNotes: event.target.value }))
                }
                fullWidth
                multiline
                rows={3}
                sx={adminFieldSx}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)", px: 3, py: 2 }}>
          <AdminFranchiseButton variant="secondary" onClick={() => setDialogOpen(false)}>
            Close
          </AdminFranchiseButton>
          <AdminFranchiseButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save workflow"}
          </AdminFranchiseButton>
        </DialogActions>
      </Dialog>
    </AdminFranchisePage>
  );
}
