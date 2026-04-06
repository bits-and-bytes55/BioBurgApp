import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
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
  adminDialogPaperSx,
  adminFieldSx,
  adminTableSx,
  formatDate,
  formatNumber,
} from "./adminFranchiseUi";

const filters = [
  "ALL",
  "PENDING",
  "APPROVED",
  "IN_PROGRESS",
  "FULFILLED",
  "REJECTED",
];

const statusOptions = ["PENDING", "APPROVED", "IN_PROGRESS", "FULFILLED", "REJECTED"];

const statusTone = (status) => {
  if (status === "FULFILLED") return "green";
  if (status === "REJECTED") return "rose";
  if (status === "IN_PROGRESS") return "blue";
  if (status === "APPROVED") return "green";
  return "amber";
};

export default function AdminFranchiseRestockRequests() {
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: "APPROVED",
    adminNote: "",
    updatedStock: "",
  });

  const fetchRequests = async (nextFilter = statusFilter) => {
    try {
      setLoading(true);
      setError("");
      const params = nextFilter && nextFilter !== "ALL" ? { status: nextFilter } : {};
      const response = await adminFranchiseApi.get(
        "/admin/franchise/restock-requests",
        { params },
      );
      setRequests(response.data.requests || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      console.error("Admin franchise restock fetch failed", err);
      setError(err.response?.data?.message || "Unable to load restock requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests("ALL");
  }, []);

  const openReview = (request) => {
    setSelectedRequest(request);
    setReviewForm({
      status: request.status || "APPROVED",
      adminNote: request.adminNote || "",
      updatedStock:
        request.status === "FULFILLED"
          ? request.targetStock || request.currentStock + request.requestedQty
          : request.targetStock || "",
    });
  };

  const closeReview = () => {
    setSelectedRequest(null);
    setReviewForm({
      status: "APPROVED",
      adminNote: "",
      updatedStock: "",
    });
  };

  const saveReview = async () => {
    if (!selectedRequest) return;

    try {
      setSaving(true);
      await adminFranchiseApi.patch(
        `/admin/franchise/restock-requests/${selectedRequest._id}`,
        reviewForm,
      );
      await fetchRequests(statusFilter);
      closeReview();
    } catch (err) {
      console.error("Admin franchise restock update failed", err);
      window.alert(err.response?.data?.message || "Unable to update restock request");
    } finally {
      setSaving(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const haystack = [
        request.franchiseApplicationId?.fullName,
        request.franchiseAccountId?.email,
        request.productName,
        request.zoneId?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return search ? haystack.includes(search.trim().toLowerCase()) : true;
    });
  }, [requests, search]);

  if (loading) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading restock queue..." />
      </AdminFranchisePage>
    );
  }

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title="Restock Requests"
          description="Approve, progress, reject, or fulfil inventory replenishment tickets. Fulfilled requests update franchise stock automatically."
          badges={
            <>
              <AdminFranchiseBadge tone="gold">{summary.total || 0} total</AdminFranchiseBadge>
              <AdminFranchiseBadge tone="amber">{summary.PENDING || 0} pending</AdminFranchiseBadge>
              <AdminFranchiseBadge tone="green">{summary.FULFILLED || 0} fulfilled</AdminFranchiseBadge>
            </>
          }
          actions={
            <AdminFranchiseButton variant="secondary" onClick={() => fetchRequests(statusFilter)}>
              Refresh
            </AdminFranchiseButton>
          }
        />

        {error ? <AdminFranchiseNotice tone="error">{error}</AdminFranchiseNotice> : null}
        <AdminFranchiseNotice tone="info">
          Use this queue to decide whether a request should move forward, be
          fulfilled, or be rejected with an operational note for the franchise.
        </AdminFranchiseNotice>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          <AdminFranchiseMetric label="Total Requests" value={formatNumber(summary.total)} helper="All franchise restock tickets" />
          <AdminFranchiseMetric label="Pending" value={formatNumber(summary.PENDING)} helper="Waiting for admin review" />
          <AdminFranchiseMetric label="In Progress" value={formatNumber(summary.IN_PROGRESS)} helper="Approved and being arranged" />
          <AdminFranchiseMetric label="Fulfilled" value={formatNumber(summary.FULFILLED)} helper="Completed and stock-synced" accent />
        </Box>

        <AdminFranchisePanel
          title="Restock Queue"
          subtitle="Filter by status, search the queue, then open the review console for the selected request."
          action={
            <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap" }}>
              <TextField
                size="small"
                placeholder="Search franchise, product, zone"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={adminFieldSx}
              />
              <Select
                size="small"
                value={statusFilter}
                onChange={(event) => {
                  const nextFilter = event.target.value;
                  setStatusFilter(nextFilter);
                  fetchRequests(nextFilter);
                }}
                sx={adminFieldSx}
              >
                {filters.map((filter) => (
                  <MenuItem key={filter} value={filter}>
                    {filter}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          }
        >
          <Box sx={{ overflowX: "auto" }}>
            {!filteredRequests.length ? (
              <AdminFranchiseEmpty
                title="No restock requests found"
                text="This queue is empty for the selected filter and search state."
              />
            ) : (
              <Table sx={adminTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Franchise</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Stock Snapshot</TableCell>
                    <TableCell>Requested Qty</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Raised On</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <Box sx={{ fontWeight: 800 }}>
                          {request.franchiseApplicationId?.fullName || "Franchise"}
                        </Box>
                        <Box sx={{ color: "#8da0ad", fontSize: 13, mt: 0.6 }}>
                          {request.franchiseAccountId?.email || "-"}
                        </Box>
                      </TableCell>
                      <TableCell>{request.zoneId?.name || "-"}</TableCell>
                      <TableCell>{request.productName}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700 }}>
                          Stock {formatNumber(request.currentStock)}
                        </Typography>
                        <Typography sx={{ color: "#8da0ad", fontSize: 13, mt: 0.6 }}>
                          Threshold {formatNumber(request.lowStockThreshold)} • Target {formatNumber(request.targetStock)}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatNumber(request.requestedQty)}</TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone="blue">{request.priority}</AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={statusTone(request.status)}>
                          {request.status}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>
                        <AdminFranchiseButton onClick={() => openReview(request)}>
                          Review
                        </AdminFranchiseButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </AdminFranchisePanel>
      </Box>

      <Dialog
        open={Boolean(selectedRequest)}
        onClose={closeReview}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: adminDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 24, letterSpacing: "-0.03em" }}>
          Review Restock Request
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Box sx={{ display: "grid", gap: 2, mt: 0.5 }}>
            <Typography sx={{ fontWeight: 800 }}>
              {selectedRequest?.franchiseApplicationId?.fullName || "Franchise"} - {selectedRequest?.productName || "Product"}
            </Typography>
            <Typography sx={{ color: "#8da0ad" }}>
              Zone: {selectedRequest?.zoneId?.name || "-"} | Requested {formatNumber(selectedRequest?.requestedQty)} units
            </Typography>
            <Typography sx={{ color: "#8da0ad", fontSize: 13.5, lineHeight: 1.8 }}>
              Franchise note: {selectedRequest?.requestNote || "No note provided"}
            </Typography>
            <Select
              value={reviewForm.status}
              onChange={(event) =>
                setReviewForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              sx={adminFieldSx}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
            {reviewForm.status === "FULFILLED" ? (
              <TextField
                label="Updated Stock After Fulfilment"
                type="number"
                value={reviewForm.updatedStock}
                onChange={(event) =>
                  setReviewForm((current) => ({
                    ...current,
                    updatedStock: event.target.value,
                  }))
                }
                inputProps={{ min: 0 }}
                helperText="This becomes the new franchise stock after fulfilment."
                sx={adminFieldSx}
              />
            ) : null}
            <TextField
              label="Admin Note"
              multiline
              rows={4}
              value={reviewForm.adminNote}
              onChange={(event) =>
                setReviewForm((current) => ({
                  ...current,
                  adminNote: event.target.value,
                }))
              }
              helperText="Mention dispatch timeline, supplier issue, rejection reason, or fulfilment note."
              sx={adminFieldSx}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
          <AdminFranchiseButton variant="secondary" onClick={closeReview}>
            Close
          </AdminFranchiseButton>
          <AdminFranchiseButton onClick={saveReview} disabled={saving}>
            {saving ? "Saving..." : "Save Review"}
          </AdminFranchiseButton>
        </DialogActions>
      </Dialog>
    </AdminFranchisePage>
  );
}
