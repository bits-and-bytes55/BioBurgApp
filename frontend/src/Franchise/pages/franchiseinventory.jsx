import React, { useEffect, useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
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
  consoleTextareaClass,
  formatDate,
  formatNumber,
} from "../components/consoleUi";

const emptySettingsForm = {
  currentStock: 0,
  lowStockThreshold: 10,
  targetStock: 25,
  preferredRestockQty: 0,
  notes: "",
};

const emptyRestockForm = {
  requestedQty: 0,
  priority: "MEDIUM",
  requestNote: "",
};

const statusTone = (status) => {
  if (status === "OUT_OF_STOCK") return "rose";
  if (status === "LOW_STOCK") return "amber";
  if (status === "BELOW_TARGET") return "blue";
  return "green";
};

const requestTone = (status) => {
  if (status === "FULFILLED") return "green";
  if (status === "REJECTED" || status === "CANCELLED") return "rose";
  if (status === "IN_PROGRESS") return "blue";
  if (status === "APPROVED") return "green";
  return "amber";
};

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function FranchiseInventory() {
  const [summary, setSummary] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingRestock, setSavingRestock] = useState(false);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogMode, setDialogMode] = useState("");
  const [settingsForm, setSettingsForm] = useState(emptySettingsForm);
  const [restockForm, setRestockForm] = useState(emptyRestockForm);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await franchiseApi.get("/franchise/inventory");
      setSummary(response.data.summary || {});
      setInventory(response.data.inventory || []);
      setRestockRequests(response.data.restockRequests || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load franchise inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openSettingsDialog = (item) => {
    setSelectedItem(item);
    setDialogMode("settings");
    setSettingsForm({
      currentStock: item.currentStock ?? 0,
      lowStockThreshold: item.lowStockThreshold ?? 10,
      targetStock: item.targetStock ?? 25,
      preferredRestockQty: item.preferredRestockQty ?? 0,
      notes: item.notes || "",
    });
  };

  const openRestockDialog = (item) => {
    setSelectedItem(item);
    setDialogMode("restock");
    setRestockForm({
      requestedQty:
        item.recommendedRestockQty ||
        item.preferredRestockQty ||
        Math.max((item.targetStock || 0) - (item.currentStock || 0), 0),
      priority: item.currentStock <= 0 ? "URGENT" : "MEDIUM",
      requestNote: "",
    });
  };

  const closeDialogs = () => {
    setSelectedItem(null);
    setDialogMode("");
    setSettingsForm(emptySettingsForm);
    setRestockForm(emptyRestockForm);
  };

  const saveSettings = async () => {
    if (!selectedItem) return;

    try {
      setSavingSettings(true);
      await franchiseApi.put(
        `/franchise/inventory/${selectedItem.productId}/settings`,
        {
          ...settingsForm,
          productName: selectedItem.productName,
        },
      );
      await fetchInventory();
      closeDialogs();
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to save inventory settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const createRestockRequest = async () => {
    if (!selectedItem) return;

    try {
      setSavingRestock(true);
      await franchiseApi.post("/franchise/inventory/restock-requests", {
        productId: selectedItem.productId,
        productName: selectedItem.productName,
        currentStock: selectedItem.currentStock,
        lowStockThreshold: selectedItem.lowStockThreshold,
        targetStock: selectedItem.targetStock,
        preferredRestockQty: selectedItem.preferredRestockQty,
        requestedQty: restockForm.requestedQty,
        priority: restockForm.priority,
        requestNote: restockForm.requestNote,
        notes: selectedItem.notes || "",
      });
      await fetchInventory();
      closeDialogs();
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to create restock request");
    } finally {
      setSavingRestock(false);
    }
  };

  if (loading) {
    return (
      <ConsolePage>
        <ConsoleLoading label="Loading inventory control..." />
      </ConsolePage>
    );
  }

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          title="Inventory & Restock Control"
          description="Maintain franchise-controlled stock, watch low-stock pressure, and raise structured replenishment requests for the admin team."
          badges={
            <>
              <ConsoleBadge tone="blue">
                {formatNumber(summary?.totalItems)} tracked products
              </ConsoleBadge>
              <ConsoleBadge tone={summary?.outOfStockItems ? "rose" : "amber"}>
                {formatNumber(summary?.outOfStockItems)} out of stock
              </ConsoleBadge>
              <ConsoleBadge tone={summary?.activeRestockRequests ? "amber" : "green"}>
                {formatNumber(summary?.activeRestockRequests)} open requests
              </ConsoleBadge>
            </>
          }
          actions={
            <ConsoleButton variant="secondary" onClick={fetchInventory}>
              Refresh
            </ConsoleButton>
          }
        />

        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <ConsoleNotice tone="info">
          Current stock is franchise-controlled. Keep it updated so low-stock alerts
          and restock requests reflect the real on-ground position for your zone.
        </ConsoleNotice>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ConsoleMetricCard
            label="Tracked Products"
            primary={formatNumber(summary?.totalItems)}
            secondary="Products with order history or manual setup"
          />
          <ConsoleMetricCard
            label="Low Stock"
            primary={formatNumber(summary?.lowStockItems)}
            secondary="Already below your alert threshold"
          />
          <ConsoleMetricCard
            label="Current Units"
            primary={formatNumber(summary?.totalCurrentStock)}
            secondary="Franchise-controlled stock on hand"
            accent
          />
          <ConsoleMetricCard
            label="Units Sold"
            primary={formatNumber(summary?.totalSoldQty)}
            secondary="Demand captured from order history"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <ConsolePanel
            title="Product stock watchlist"
            subtitle="Watch item-level stock, thresholds, targets, and active restock requests"
          >
            {inventory.length ? (
              <>
                <div className="grid gap-3 md:hidden">
                  {inventory.map((item) => (
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
                            Source {item.source} • Last sold {formatDate(item.lastSoldAt)}
                          </div>
                        </div>
                        <ConsoleBadge tone={statusTone(item.stockStatus)}>
                          {item.stockStatus.replaceAll("_", " ")}
                        </ConsoleBadge>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                            Current
                          </div>
                          <div className="mt-1 font-semibold text-slate-100">
                            {formatNumber(item.currentStock)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                            Threshold
                          </div>
                          <div className="mt-1 font-semibold text-slate-100">
                            {formatNumber(item.lowStockThreshold)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                            Target
                          </div>
                          <div className="mt-1 font-semibold text-slate-100">
                            {formatNumber(item.targetStock)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                            Need
                          </div>
                          <div className="mt-1 font-semibold text-amber-400">
                            {formatNumber(item.recommendedRestockQty)}
                          </div>
                        </div>
                      </div>

                      {item.activeRestockRequest ? (
                        <div className="mt-3">
                          <ConsoleBadge tone={requestTone(item.activeRestockRequest.status)}>
                            Open request • {item.activeRestockRequest.status}
                          </ConsoleBadge>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <ConsoleButton
                          variant="secondary"
                          onClick={() => openSettingsDialog(item)}
                        >
                          Edit stock
                        </ConsoleButton>
                        <ConsoleButton
                          onClick={() => openRestockDialog(item)}
                          disabled={Boolean(item.activeRestockRequest)}
                        >
                          {item.activeRestockRequest ? "Requested" : "Raise request"}
                        </ConsoleButton>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="franchise-console-table min-w-full text-sm">
                    <thead>
                      <tr>
                        {[
                          "Product",
                          "Current Stock",
                          "Threshold",
                          "Target",
                          "Sold Qty",
                          "Status",
                          "Restock",
                          "Actions",
                        ].map((header) => (
                          <th key={header} className={consoleTableHeadClass}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <tr key={item.productId}>
                          <td className={`${consoleTableCellClass} min-w-[220px]`}>
                            <div className="font-semibold text-slate-100">
                              {item.productName}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Source: {item.source}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Last sold: {formatDate(item.lastSoldAt)}
                            </div>
                          </td>
                          <td className={consoleTableCellClass}>
                            {formatNumber(item.currentStock)}
                          </td>
                          <td className={consoleTableCellClass}>
                            {formatNumber(item.lowStockThreshold)}
                          </td>
                          <td className={consoleTableCellClass}>
                            {formatNumber(item.targetStock)}
                          </td>
                          <td className={consoleTableCellClass}>
                            {formatNumber(item.soldQty)}
                          </td>
                          <td className={`${consoleTableCellClass} min-w-[180px]`}>
                            <div className="flex flex-col gap-2">
                              <ConsoleBadge tone={statusTone(item.stockStatus)}>
                                {item.stockStatus.replaceAll("_", " ")}
                              </ConsoleBadge>
                              {item.activeRestockRequest ? (
                                <ConsoleBadge
                                  tone={requestTone(item.activeRestockRequest.status)}
                                >
                                  Open request • {item.activeRestockRequest.status}
                                </ConsoleBadge>
                              ) : null}
                            </div>
                          </td>
                          <td className={consoleTableCellClass}>
                            <div className="console-mono font-semibold text-amber-400">
                              {formatNumber(item.recommendedRestockQty)}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              gap {formatNumber(item.stockGap)}
                            </div>
                          </td>
                          <td className={consoleTableCellClass}>
                            <div className="flex flex-wrap gap-2">
                              <ConsoleButton
                                variant="secondary"
                                onClick={() => openSettingsDialog(item)}
                              >
                                Edit stock
                              </ConsoleButton>
                              <ConsoleButton
                                onClick={() => openRestockDialog(item)}
                                disabled={Boolean(item.activeRestockRequest)}
                              >
                                {item.activeRestockRequest ? "Requested" : "Raise request"}
                              </ConsoleButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <ConsoleEmptyState
                title="No inventory tracked yet"
                text="Once orders start landing in your zone, products will appear here automatically."
              />
            )}
          </ConsolePanel>

          <div className="grid gap-6">
            <ConsolePanel
              title="Inventory pulse"
              subtitle="Quick summary of product health and stock positioning"
            >
              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-600">
                    Out of stock
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-rose-400">
                    {formatNumber(summary?.outOfStockItems)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-600">
                    Below target
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-sky-400">
                    {formatNumber(summary?.belowTargetItems)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-600">
                    Healthy products
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-400">
                    {formatNumber(summary?.healthyItems)}
                  </div>
                </div>
              </div>
            </ConsolePanel>

            <ConsolePanel
              title="Restock request history"
              subtitle="Track request priority, admin action, and notes"
            >
              {restockRequests.length ? (
                <div className="grid gap-3">
                  {restockRequests.map((request) => (
                    <div
                      key={request._id}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-100">
                            {request.productName}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Stock {formatNumber(request.currentStock)} / Threshold{" "}
                            {formatNumber(request.lowStockThreshold)}
                          </div>
                        </div>
                        <ConsoleBadge tone={requestTone(request.status)}>
                          {request.status}
                        </ConsoleBadge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <ConsoleBadge tone="amber">
                          Priority {request.priority}
                        </ConsoleBadge>
                        <ConsoleBadge tone="blue">
                          Qty {formatNumber(request.requestedQty)}
                        </ConsoleBadge>
                      </div>

                      <div className="mt-3 text-sm leading-6 text-slate-400">
                        {request.requestNote || "No franchise note"}
                      </div>
                      {request.adminNote ? (
                        <div className="mt-2 text-sm leading-6 text-slate-500">
                          Admin: {request.adminNote}
                        </div>
                      ) : null}
                      <div className="mt-2 text-xs text-slate-600">
                        Raised on {formatDate(request.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ConsoleEmptyState
                  title="No request history yet"
                  text="Raised restock requests will appear here with their admin status."
                />
              )}
            </ConsolePanel>
          </div>
        </div>
      </div>

      <Dialog
        className="franchise-console-dialog"
        open={dialogMode === "settings" && Boolean(selectedItem)}
        onClose={closeDialogs}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update Inventory Stock</DialogTitle>
        <DialogContent dividers>
          <div className="grid gap-4">
            <div className="text-sm text-slate-400">
              {selectedItem?.productName || "Product"}
            </div>
            <Field label="Current Stock">
              <input
                className={consoleInputClass}
                type="number"
                min="0"
                value={settingsForm.currentStock}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    currentStock: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Low Stock Threshold">
              <input
                className={consoleInputClass}
                type="number"
                min="0"
                value={settingsForm.lowStockThreshold}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    lowStockThreshold: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Target Stock">
              <input
                className={consoleInputClass}
                type="number"
                min="0"
                value={settingsForm.targetStock}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    targetStock: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Preferred Restock Qty">
              <input
                className={consoleInputClass}
                type="number"
                min="0"
                value={settingsForm.preferredRestockQty}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    preferredRestockQty: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Notes">
              <textarea
                className={consoleTextareaClass}
                rows={4}
                value={settingsForm.notes}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Pack-size notes, supplier constraints, or shelf-level context."
              />
            </Field>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <ConsoleButton variant="secondary" onClick={closeDialogs}>
            Close
          </ConsoleButton>
          <ConsoleButton onClick={saveSettings} disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Stock Setup"}
          </ConsoleButton>
        </DialogActions>
      </Dialog>

      <Dialog
        className="franchise-console-dialog"
        open={dialogMode === "restock" && Boolean(selectedItem)}
        onClose={closeDialogs}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create Restock Request</DialogTitle>
        <DialogContent dividers>
          <div className="grid gap-4">
            <div className="text-sm text-slate-400">
              {selectedItem?.productName || "Product"}
            </div>
            <ConsoleNotice tone="warning">
              Current stock {formatNumber(selectedItem?.currentStock)} is against
              threshold {formatNumber(selectedItem?.lowStockThreshold)} and target{" "}
              {formatNumber(selectedItem?.targetStock)}.
            </ConsoleNotice>
            <Field label="Requested Quantity">
              <input
                className={consoleInputClass}
                type="number"
                min="1"
                value={restockForm.requestedQty}
                onChange={(event) =>
                  setRestockForm((current) => ({
                    ...current,
                    requestedQty: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Priority">
              <select
                className={consoleInputClass}
                value={restockForm.priority}
                onChange={(event) =>
                  setRestockForm((current) => ({
                    ...current,
                    priority: event.target.value,
                  }))
                }
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </Field>
            <Field label="Request Note">
              <textarea
                className={consoleTextareaClass}
                rows={4}
                value={restockForm.requestNote}
                onChange={(event) =>
                  setRestockForm((current) => ({
                    ...current,
                    requestNote: event.target.value,
                  }))
                }
                placeholder="Mention supplier urgency, demand spike, or special handling."
              />
            </Field>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <ConsoleButton variant="secondary" onClick={closeDialogs}>
            Close
          </ConsoleButton>
          <ConsoleButton onClick={createRestockRequest} disabled={savingRestock}>
            {savingRestock ? "Submitting..." : "Submit Request"}
          </ConsoleButton>
        </DialogActions>
      </Dialog>
    </ConsolePage>
  );
}
