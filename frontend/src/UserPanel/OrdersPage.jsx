import React, { useEffect, useState } from "react";
import axios from "axios";
import InvoiceModal from "../components/Invoicemodal"; 

const BASE_API = import.meta.env.VITE_API_BASE_URL;

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_INFO = {
  PRESCRIPTION_UPLOADED: { label: "Rx Uploaded",       color: "#7b1fa2", bg: "#f3e5f5" },
  UNDER_REVIEW:          { label: "Under Review",       color: "#f57c00", bg: "#fff3e0" },
  APPROVED:              { label: "Approved",           color: "#388e3c", bg: "#e8f5e9" },
  REJECTED:              { label: "Rejected",           color: "#d32f2f", bg: "#ffebee" },
  PLACED:                { label: "Placed",             color: "#1565c0", bg: "#e3f2fd" },
  CONFIRMED:             { label: "Confirmed",          color: "#0277bd", bg: "#e1f5fe" },
  PROCESSING:            { label: "Processing",         color: "#00838f", bg: "#e0f7fa" },
  SHIPPED:               { label: "Shipped",            color: "#2e7d32", bg: "#e8f5e9" },
  OUT_FOR_DELIVERY:      { label: "Out for Delivery",   color: "#e65100", bg: "#fff8e1" },
  DELIVERED:             { label: "Delivered",          color: "#1b5e20", bg: "#f1f8e9" },
  CANCELLED:             { label: "Cancelled",          color: "#b71c1c", bg: "#ffebee" },
  RETURN_REQUESTED:      { label: "Return Requested",   color: "#6d4c41", bg: "#efebe9" },
  REPLACE_REQUESTED:     { label: "Replace Requested",  color: "#4527a0", bg: "#ede7f6" },
};

const NORMAL_FLOW       = ["PLACED","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED"];
const PRESCRIPTION_FLOW = ["PRESCRIPTION_UPLOADED","UNDER_REVIEW","APPROVED","PLACED","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED"];
const FILTER_TABS       = ["ALL","PLACED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"];

// Cancellable when order hasn't left Processing yet
const CANCELLABLE_STATUSES  = ["PLACED","CONFIRMED","PROCESSING"];
// Return/Replace only after delivered
const RETURNABLE_STATUSES   = ["DELIVERED"];

function getStatusInfo(status) {
  return STATUS_INFO[status?.toUpperCase()] || { label: status, color: "#666", bg: "#f5f5f5" };
}

// ── Progress Stepper ──────────────────────────────────────────────────────────
function OrderStepper({ order }) {
  const isPrescription = order.orderType === "PRESCRIPTION";
  const flow = isPrescription ? PRESCRIPTION_FLOW : NORMAL_FLOW;
  const currentIdx = flow.indexOf(order.orderStatus?.toUpperCase());
  return (
    <div style={{ overflowX: "auto", padding: "12px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", minWidth: flow.length * 90 }}>
        {flow.map((step, i) => {
          const info = getStatusInfo(step);
          const done   = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              {i < flow.length - 1 && (
                <div style={{ position: "absolute", top: 12, left: "50%", width: "100%", height: 2,
                  backgroundColor: done && i < currentIdx ? info.color : "#e0e0e0", zIndex: 0 }} />
              )}
              <div style={{ width: 24, height: 24, borderRadius: "50%", zIndex: 1,
                backgroundColor: done ? info.color : "#e0e0e0",
                border: active ? `3px solid ${info.color}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: active ? `0 0 0 4px ${info.color}22` : "none", flexShrink: 0 }}>
                {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
              </div>
              <span style={{ fontSize: 10, marginTop: 5, textAlign: "center", fontWeight: done ? 600 : 400,
                color: done ? info.color : "#9e9e9e", lineHeight: 1.3, maxWidth: 72 }}>
                {info.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Confirm Action Dialog ─────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, color, onConfirm, onClose, loading }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 380, width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: "#1e293b" }}>{title}</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={loading}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none",
              background: color || "#ef4444", color: "#fff", cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 700, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Processing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Single Order Card ─────────────────────────────────────────────────────────
function OrderCard({ order, onOrderUpdated }) {
  const [expanded,     setExpanded]     = useState(false);
  const [invoiceOpen,  setInvoiceOpen]  = useState(false);
  const [dialog,       setDialog]       = useState(null); // { type: 'cancel'|'return'|'replace', reason: '' }
  const [reason,       setReason]       = useState("");
  const [actionLoading,setActionLoading]= useState(false);
  const [actionError,  setActionError]  = useState("");

  const statusInfo     = getStatusInfo(order.orderStatus);
  const isPrescription = order.orderType === "PRESCRIPTION";
  const shortId        = order._id?.slice(-8).toUpperCase();
  const date           = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const statusUpper = order.orderStatus?.toUpperCase();
  const canCancel   = CANCELLABLE_STATUSES.includes(statusUpper);
  const canReturn   = RETURNABLE_STATUSES.includes(statusUpper);
  const canInvoice  = order.invoiceReady ||
    ["PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED"].includes(statusUpper);

  // GST rate
  const GST_RATE = 12;

  const handleAction = async () => {
    if (!dialog) return;
    setActionLoading(true);
    setActionError("");
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${BASE_API}/api/orders/${order._id}/${dialog.type}`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDialog(null);
      setReason("");
      onOrderUpdated(); // refresh list
    } catch (e) {
      setActionError(e.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const DIALOG_CONFIG = {
    cancel:  { title: "Cancel Order?",          color: "#ef4444",
      message: "Your order will be cancelled. Refund (if any) will be processed within 5-7 business days." },
    return:  { title: "Request Return?",         color: "#f97316",
      message: "Submit a return request. Our team will review and arrange a pickup." },
    replace: { title: "Request Replacement?",   color: "#8b5cf6",
      message: "Submit a replacement request. Our team will process it within 24-48 hours." },
  };

  return (
    <>
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 16,
        overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

        {/* ── Order Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", cursor: "pointer", backgroundColor: "#fff" }}
          onClick={() => setExpanded(!expanded)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10,
              backgroundColor: isPrescription ? "#f3e5f5" : "#e3f2fd",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 18 }}>{isPrescription ? "📋" : "🛍️"}</span>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Order #{shortId}</span>
                {isPrescription && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    backgroundColor: "#f3e5f5", color: "#7b1fa2" }}>Prescription</span>
                )}
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{date}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
              backgroundColor: statusInfo.bg, color: statusInfo.color,
              border: `1px solid ${statusInfo.color}33` }}>
              {statusInfo.label}
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
              ₹{(order.totalAmount || 0).toLocaleString()}
            </span>
            <span style={{ color: "#94a3b8", fontSize: 18 }}>{expanded ? "▲" : "▼"}</span>
          </div>
        </div>

        {/* ── Expanded Content ── */}
        {expanded && (
          <div style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}>

            {/* Progress */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <OrderStepper order={order} />
            </div>

            {/* Items */}
            <div style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", margin: "0 0 10px",
                textTransform: "uppercase", letterSpacing: 1 }}>Items</p>

              {order.items?.length > 0 ? order.items.map((item, i) => {
                const name     = item.productId?.brandName || item.productId?.name || "Product";
                const img      = item.productId?.images?.[0]?.url;
                const basePrice = item.priceAtAdded || item.price || 0;
                const qty      = item.quantity || 1;
                const lineBase  = basePrice * qty;
                const lineGst   = (lineBase * GST_RATE) / 100;
                const lineTotal = lineBase + lineGst;

                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 0", borderBottom: i < order.items.length - 1 ? "1px dashed #e2e8f0" : "none" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: "#e3f2fd",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, overflow: "hidden" }}>
                      {img
                        ? <img src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 20 }}>💊</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Qty: {qty} &nbsp;·&nbsp; ₹{basePrice.toFixed(2)} × {qty}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                        GST ({GST_RATE}%): +₹{lineGst.toFixed(2)}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>₹{lineTotal.toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>incl. GST</div>
                    </div>
                  </div>
                );
              }) : (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>
                  {isPrescription ? "Items confirmed after prescription approval" : "No items"}
                </p>
              )}

              {/* Prescription */}
              {isPrescription && order.prescription?.url && (
                <div style={{ marginTop: 12, padding: 12, background: "#f3e5f5", borderRadius: 8 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#7b1fa2" }}>📋 Your Prescription</p>
                  <a href={order.prescription.url} target="_blank" rel="noreferrer"
                    style={{ display: "inline-block", padding: "6px 14px", background: "#7b1fa2",
                      color: "#fff", borderRadius: 6, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                    View Prescription ↗
                  </a>
                </div>
              )}

              {/* ── Order Totals ── */}
              {order.items?.length > 0 && (() => {
                const baseSum  = order.items.reduce((s, i) => s + (i.priceAtAdded || i.price || 0) * (i.quantity || 1), 0);
                const gstSum   = (baseSum * GST_RATE) / 100;
                const grandTot = baseSum + gstSum;
                return (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: "#64748b" }}>
                      <span>Subtotal (excl. GST)</span><span>₹{baseSum.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: "#64748b" }}>
                      <span>GST ({GST_RATE}%)</span><span>+₹{gstSum.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      background: "#1e3a8a", borderRadius: 8, padding: "10px 14px", color: "white" }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Total (incl. GST)</span>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>₹{grandTot.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Tracking History */}
            {order.trackingHistory?.length > 0 && (
              <div style={{ padding: "0 20px 16px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", margin: "0 0 10px",
                  textTransform: "uppercase", letterSpacing: 1 }}>Tracking History</p>
                {[...order.trackingHistory].reverse().map((t, i) => {
                  const info = getStatusInfo(t.status);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%",
                        backgroundColor: info.color, marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: info.color }}>{info.label}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>
                          {new Date(t.time).toLocaleString("en-IN")}
                          {t.note && ` · ${t.note}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div style={{ padding: "12px 20px 20px", display: "flex", gap: 10, flexWrap: "wrap",
              borderTop: "1px solid #f1f5f9" }}>

              {/* Invoice Download */}
              {canInvoice && (
                <button onClick={() => setInvoiceOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 18px", borderRadius: 8, border: "none",
                    background: "linear-gradient(135deg,#1e3a8a,#2563eb)",
                    color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  📄 Download Invoice
                </button>
              )}

              {/* Cancel */}
              {canCancel && (
                <button onClick={() => setDialog({ type: "cancel" })}
                  style={{ padding: "9px 18px", borderRadius: 8,
                    border: "1px solid #fca5a5", background: "#fef2f2",
                    color: "#dc2626", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  ✕ Cancel Order
                </button>
              )}

              {/* Return */}
              {canReturn && (
                <button onClick={() => setDialog({ type: "return" })}
                  style={{ padding: "9px 18px", borderRadius: 8,
                    border: "1px solid #fdba74", background: "#fff7ed",
                    color: "#ea580c", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  ↩ Return Order
                </button>
              )}

              {/* Replace */}
              {canReturn && (
                <button onClick={() => setDialog({ type: "replace" })}
                  style={{ padding: "9px 18px", borderRadius: 8,
                    border: "1px solid #c4b5fd", background: "#faf5ff",
                    color: "#7c3aed", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  🔄 Replace Order
                </button>
              )}

              {/* Invoice not ready notice */}
              {!canInvoice && !["CANCELLED","RETURN_REQUESTED","REPLACE_REQUESTED"].includes(statusUpper) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 8, background: "#f8fafc",
                  border: "1px dashed #cbd5e1", fontSize: 12, color: "#64748b" }}>
                  📋 Invoice available once order is confirmed for processing
                </div>
              )}
            </div>

            {actionError && (
              <div style={{ margin: "0 20px 16px", padding: "10px 14px", background: "#fef2f2",
                border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626" }}>
                {actionError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Invoice Modal ── */}
      <InvoiceModal open={invoiceOpen} order={order} onClose={() => setInvoiceOpen(false)} />

      {/* ── Confirm Dialog ── */}
      {dialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 400, width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "#1e293b" }}>
              {DIALOG_CONFIG[dialog.type]?.title}
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
              {DIALOG_CONFIG[dialog.type]?.message}
            </p>

            {/* Reason box */}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Reason for ${dialog.type} (optional)`}
              style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0",
                padding: "10px 12px", fontSize: 13, resize: "vertical", minHeight: 72,
                fontFamily: "inherit", outline: "none", marginBottom: 16, boxSizing: "border-box" }}
            />

            {actionError && (
              <div style={{ marginBottom: 12, fontSize: 12, color: "#dc2626",
                background: "#fef2f2", padding: "8px 12px", borderRadius: 6 }}>
                {actionError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setDialog(null); setReason(""); setActionError(""); }}
                disabled={actionLoading}
                style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
                  background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Go Back
              </button>
              <button onClick={handleAction} disabled={actionLoading}
                style={{ padding: "9px 20px", borderRadius: 8, border: "none",
                  background: DIALOG_CONFIG[dialog.type]?.color || "#ef4444",
                  color: "#fff", cursor: actionLoading ? "not-allowed" : "pointer",
                  fontSize: 13, fontWeight: 700, opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? "Processing…" : `Confirm ${dialog.type.charAt(0).toUpperCase() + dialog.type.slice(1)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Orders Page ──────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_API}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(res.data) ? res.data : res.data.orders || []);
    } catch {
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PROCESSING")
      return ["CONFIRMED","PROCESSING","PRESCRIPTION_UPLOADED","UNDER_REVIEW","APPROVED"]
        .includes(o.orderStatus?.toUpperCase());
    return o.orderStatus?.toUpperCase() === activeTab;
  });

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading your orders…</p>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <p style={{ color: "#ef4444", fontSize: 14 }}>{error}</p>
      <button onClick={fetchOrders}
        style={{ marginTop: 12, padding: "8px 20px", background: "#6892D5",
          color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
        Retry
      </button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" }}>My Orders</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={fetchOrders}
          style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
            background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748b" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTER_TABS.map((tab) => {
          const count = tab === "ALL" ? orders.length
            : tab === "PROCESSING"
            ? orders.filter(o => ["CONFIRMED","PROCESSING","PRESCRIPTION_UPLOADED","UNDER_REVIEW","APPROVED"].includes(o.orderStatus?.toUpperCase())).length
            : orders.filter(o => o.orderStatus?.toUpperCase() === tab).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: "6px 16px", borderRadius: 20, border: "1px solid",
                borderColor: activeTab === tab ? "#6892D5" : "#e2e8f0",
                backgroundColor: activeTab === tab ? "#6892D5" : "#fff",
                color: activeTab === tab ? "#fff" : "#64748b",
                fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 16, margin: "0 0 4px" }}>No orders found</p>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            {activeTab === "ALL" ? "All your past orders will appear here." : `No ${activeTab.toLowerCase()} orders yet.`}
          </p>
        </div>
      ) : (
        filtered.map(order => <OrderCard key={order._id} order={order} onOrderUpdated={fetchOrders} />)
      )}
    </div>
  );
}