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
import bulkManufacturingApi from "../bulkManufactureApi";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleEmptyState,
  ConsoleHeader,
  ConsoleLoading,
  ConsoleMetricCard,
  ConsoleNotice,
  ConsolePanel,
  formatDate,
} from "../../Franchise/components/consoleUi";

const initialForm = {
  productName: "",
  dosageForm: "",
  packaging: "",
  quantity: "",
  targetCountry: "",
  targetTimeline: "",
  priority: "MEDIUM",
  notes: "",
};

const statusOptions = [
  "ALL",
  "SUBMITTED",
  "UNDER_REVIEW",
  "QUOTED",
  "REVISION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "CLOSED",
];

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    color: "#edf3f7",
    bgcolor: "rgba(255,255,255,0.03)",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.08)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(215,178,109,0.32)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(215,178,109,0.85)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#8da0ad",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#f0d59d",
  },
  "& .MuiInputBase-input": {
    color: "#edf3f7",
  },
  "& .MuiSvgIcon-root": {
    color: "#8da0ad",
  },
};

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

export default function Requirements() {
  const [data, setData] = useState({ requirements: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [attachmentFile, setAttachmentFile] = useState(null);

  const fetchRequirements = async (nextStatus = status, nextSearch = search) => {
    try {
      setLoading(true);
      setError("");
      const response = await bulkManufacturingApi.get(
        "/bulk-manufacturing-portal/requirements",
        {
          params: {
            status: nextStatus,
            search: nextSearch,
          },
        },
      );
      setData(response.data);
    } catch (requirementsError) {
      console.error("Bulk requirements fetch error:", requirementsError);
      setError(
        requirementsError.response?.data?.message ||
          "Unable to load requirements.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: "Total Requirements",
        primary: data.summary?.total || 0,
        secondary: "All requirements currently linked to your account",
        accent: true,
      },
      {
        label: "Open Review",
        primary: data.summary?.open || 0,
        secondary: "Submitted, under review, or revision requested",
      },
      {
        label: "Quoted",
        primary: data.summary?.quoted || 0,
        secondary: "Requirements with commercial quote details",
      },
      {
        label: "Approved / Closed",
        primary: (data.summary?.approved || 0) + (data.summary?.closed || 0),
        secondary: "Requirements already finalised or archived",
      },
    ],
    [data.summary],
  );

  const openCreateDialog = () => {
    setSelectedRequirement(null);
    setForm(initialForm);
    setAttachmentFile(null);
    setDialogOpen(true);
  };

  const openEditDialog = (requirement) => {
    setSelectedRequirement(requirement);
    setForm({
      productName: requirement.productName || "",
      dosageForm: requirement.dosageForm || "",
      packaging: requirement.packaging || "",
      quantity: requirement.quantity || "",
      targetCountry: requirement.targetCountry || "",
      targetTimeline: requirement.targetTimeline || "",
      priority: requirement.priority || "MEDIUM",
      notes: requirement.notes || "",
    });
    setAttachmentFile(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedRequirement(null);
    setForm(initialForm);
    setAttachmentFile(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let attachmentUrl = selectedRequirement?.attachmentUrl || "";

      if (attachmentFile) {
        attachmentUrl = await uploadToCloudinary(
          attachmentFile,
          "bioburg/bulk-manufacturing/requirements",
        );
      }

      const payload = {
        ...form,
        attachmentUrl,
      };

      if (selectedRequirement?._id) {
        await bulkManufacturingApi.put(
          `/bulk-manufacturing-portal/requirements/${selectedRequirement._id}`,
          payload,
        );
      } else {
        await bulkManufacturingApi.post(
          "/bulk-manufacturing-portal/requirements",
          payload,
        );
      }

      closeDialog();
      await fetchRequirements();
    } catch (saveError) {
      console.error("Bulk requirement save error:", saveError);
      setError(
        saveError.response?.data?.message ||
          "Unable to save requirement right now.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (requirementId) => {
    try {
      setDeletingId(requirementId);
      setError("");
      await bulkManufacturingApi.delete(
        `/bulk-manufacturing-portal/requirements/${requirementId}`,
      );
      await fetchRequirements();
    } catch (deleteError) {
      console.error("Bulk requirement delete error:", deleteError);
      setError(
        deleteError.response?.data?.message ||
          "Unable to delete requirement.",
      );
    } finally {
      setDeletingId("");
    }
  };

  if (loading) {
    return <ConsoleLoading label="Loading requirements desk..." />;
  }

  return (
    <Box>
      <ConsoleHeader
        eyebrow="Requirement Desk"
        title="Manage manufacturing needs with a cleaner quote-ready workspace."
        description="Raise new requirements, revise requested items, and follow quote movement without losing application context."
        actions={
          <>
            <ConsoleButton variant="secondary" onClick={() => fetchRequirements()}>
              Refresh
            </ConsoleButton>
            <ConsoleButton onClick={openCreateDialog}>New requirement</ConsoleButton>
          </>
        }
      />

      {error ? (
        <Box sx={{ mt: 3 }}>
          <ConsoleNotice tone="error">{error}</ConsoleNotice>
        </Box>
      ) : null}

      <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} lg={3} key={metric.label}>
            <ConsoleMetricCard {...metric} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 2.5 }}>
        <ConsolePanel
          title="Requirement Ledger"
          subtitle="Filter by status or search specific product needs. Quoted items will also surface commercial details here."
          action={
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product or note"
                sx={{ ...fieldSx, minWidth: 220 }}
              />
              <TextField
                select
                size="small"
                value={status}
                onChange={(event) => {
                  const nextStatus = event.target.value;
                  setStatus(nextStatus);
                  fetchRequirements(nextStatus, search);
                }}
                sx={{ ...fieldSx, minWidth: 180 }}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <ConsoleButton
                variant="secondary"
                onClick={() => fetchRequirements(status, search)}
              >
                Apply
              </ConsoleButton>
            </Stack>
          }
        >
          {data.requirements?.length === 0 ? (
            <ConsoleEmptyState
              title="No requirements found"
              text="Create your first manufacturing requirement to start the commercial and review workflow."
            />
          ) : (
            <Stack spacing={1.6}>
              {data.requirements.map((item) => (
                <Box
                  key={item._id}
                  sx={{
                    p: 2.4,
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
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Typography
                          className="console-display"
                          sx={{ fontSize: 22, lineHeight: 1, fontWeight: 700 }}
                        >
                          {item.productName}
                        </Typography>
                        <ConsoleBadge tone={getTone(item.status)}>
                          {item.status}
                        </ConsoleBadge>
                        <ConsoleBadge tone="blue">{item.priority}</ConsoleBadge>
                      </Stack>
                      <Typography sx={{ mt: 1.2, color: "#8da0ad", lineHeight: 1.8, fontSize: 14 }}>
                        Qty {item.quantity}
                        {item.targetCountry ? ` • Target ${item.targetCountry}` : ""}
                        {item.targetTimeline ? ` • Timeline ${item.targetTimeline}` : ""}
                        {item.dosageForm ? ` • ${item.dosageForm}` : ""}
                        {item.packaging ? ` • ${item.packaging}` : ""}
                      </Typography>

                      {item.notes ? (
                        <Typography sx={{ mt: 1.5, color: "#d8e2e8", lineHeight: 1.8 }}>
                          {item.notes}
                        </Typography>
                      ) : null}

                      {item.adminNotes ? (
                        <Box sx={{ mt: 1.8 }}>
                          <ConsoleNotice tone="info">
                            Admin note: {item.adminNotes}
                          </ConsoleNotice>
                        </Box>
                      ) : null}

                      {item.quote?.updatedAt ? (
                        <Box sx={{ mt: 1.8 }}>
                          <ConsoleNotice tone="success">
                            Quote updated on {formatDate(item.quote.updatedAt)}:
                            {` ${item.quote.currency || "USD"} ${item.quote.unitPrice || 0}`}
                            {item.quote.moq ? ` • MOQ ${item.quote.moq}` : ""}
                            {item.quote.leadTimeDays
                              ? ` • Lead time ${item.quote.leadTimeDays} days`
                              : ""}
                            {item.quote.quoteNotes ? ` • ${item.quote.quoteNotes}` : ""}
                          </ConsoleNotice>
                        </Box>
                      ) : null}
                    </Box>

                    <Stack direction={{ xs: "row", lg: "column" }} spacing={1}>
                      <Typography sx={{ color: "#8da0ad", fontSize: 12.5 }}>
                        Created {formatDate(item.createdAt)}
                      </Typography>
                      <ConsoleButton
                        variant="secondary"
                        onClick={() => openEditDialog(item)}
                        disabled={["APPROVED", "CLOSED"].includes(item.status)}
                      >
                        Edit
                      </ConsoleButton>
                      <ConsoleButton
                        variant="danger"
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                      >
                        {deletingId === item._id ? "Deleting..." : "Delete"}
                      </ConsoleButton>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </ConsolePanel>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: "transparent",
            background:
              "radial-gradient(circle at top left, rgba(215,178,109,0.08), transparent 34%), linear-gradient(180deg, rgba(10,14,19,0.98), rgba(6,9,13,0.98))",
            color: "#edf3f7",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 4,
            boxShadow: "0 36px 90px rgba(0, 0, 0, 0.45)",
          },
        }}
      >
        <DialogTitle>
          {selectedRequirement ? "Edit Requirement" : "Create Requirement"}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Product Name"
                value={form.productName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, productName: event.target.value }))
                }
                fullWidth
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Quantity"
                value={form.quantity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, quantity: event.target.value }))
                }
                fullWidth
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Dosage Form"
                value={form.dosageForm}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dosageForm: event.target.value }))
                }
                fullWidth
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Packaging"
                value={form.packaging}
                onChange={(event) =>
                  setForm((current) => ({ ...current, packaging: event.target.value }))
                }
                fullWidth
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Target Country"
                value={form.targetCountry}
                onChange={(event) =>
                  setForm((current) => ({ ...current, targetCountry: event.target.value }))
                }
                fullWidth
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Target Timeline"
                value={form.targetTimeline}
                onChange={(event) =>
                  setForm((current) => ({ ...current, targetTimeline: event.target.value }))
                }
                fullWidth
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Priority"
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({ ...current, priority: event.target.value }))
                }
                fullWidth
                sx={fieldSx}
              >
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="label"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 42,
                  px: 2,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#edf3f7",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {attachmentFile
                  ? attachmentFile.name
                  : selectedRequirement?.attachmentUrl
                    ? "Replace attachment"
                    : "Upload attachment"}
                <input
                  hidden
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xlsx"
                  onChange={(event) =>
                    setAttachmentFile(event.target.files?.[0] || null)
                  }
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                fullWidth
                multiline
                rows={4}
                sx={fieldSx}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)", px: 3, py: 2 }}>
          <ConsoleButton variant="secondary" onClick={closeDialog}>
            Cancel
          </ConsoleButton>
          <ConsoleButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : selectedRequirement ? "Update" : "Create"}
          </ConsoleButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
