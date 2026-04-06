import React, { useState } from "react";
import franchiseApi from "../franchiseApi";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleNotice,
} from "./consoleUi";

const actionMap = {
  PLACED: { nextStatus: "ACCEPTED", label: "Accept Order" },
  ACCEPTED: { nextStatus: "PACKED", label: "Mark Packed" },
  PACKED: { nextStatus: "SHIPPED", label: "Mark Shipped" },
  SHIPPED: { nextStatus: "DELIVERED", label: "Mark Delivered" },
};

export default function OrderStatusActions({ order, onStatusUpdated }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const action = actionMap[order?.orderStatus];

  const updateStatus = async () => {
    if (!order?._id || !action) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await franchiseApi.put(`/franchise/orders/${order._id}/status`, {
        status: action.nextStatus,
      });

      if (typeof onStatusUpdated === "function") {
        await onStatusUpdated();
      }
    } catch (err) {
      console.error("Franchise order status update failed", err);
      setError(err.response?.data?.message || "Unable to update order status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="text-[10px] uppercase tracking-[0.26em] text-slate-600">
          Current status
        </div>
        <div className="mt-3">
          <ConsoleBadge tone="blue">{order?.orderStatus || "UNKNOWN"}</ConsoleBadge>
        </div>
      </div>

      {action ? (
        <ConsoleButton onClick={updateStatus} disabled={saving}>
          {saving ? "Updating..." : action.label}
        </ConsoleButton>
      ) : order?.orderStatus === "DELIVERED" ? (
        <ConsoleBadge tone="green">Order completed</ConsoleBadge>
      ) : (
        <ConsoleBadge tone="neutral">
          No action for {order?.orderStatus || "current status"}
        </ConsoleBadge>
      )}
    </div>
  );
}
