import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import franchiseApi from "../franchiseApi";
import OrderStatusActions from "../components/OrderStatusActions";
import FranchiseInvoiceDialog from "../components/FranchiseInvoiceDialog";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleEmptyState,
  ConsoleHeader,
  ConsoleLoading,
  ConsoleNotice,
  ConsolePage,
  ConsolePanel,
  formatCurrency,
  formatDateTime,
} from "../components/consoleUi";

const statusTone = (status) => {
  if (status === "DELIVERED") return "green";
  if (status === "CANCELLED" || status === "REJECTED") return "rose";
  if (status === "SHIPPED" || status === "PACKED") return "blue";
  return "amber";
};

const paymentTone = (status) => {
  if (status === "PAID") return "green";
  if (status === "FAILED") return "rose";
  return "amber";
};

const getProductName = (item) =>
  item?.name || item?.productId?.brandName || item?.productId?.genericName || "Product";

function KeyValue({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-white/[0.05] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="max-w-[62%] text-right text-sm font-semibold text-slate-100">
        {value}
      </div>
    </div>
  );
}

function Timeline({ history }) {
  if (!history?.length) {
    return (
      <ConsoleEmptyState
        title="No tracking history yet"
        text="Status updates will appear here as the order moves forward."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {history.map((entry, index) => (
        <div key={`${entry.status || "history"}-${index}`} className="flex gap-4">
          <div className="flex w-5 flex-col items-center">
            <div
              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                index === 0 ? "bg-amber-400" : "bg-slate-500"
              }`}
            />
            {index < history.length - 1 ? (
              <div className="mt-1 h-full w-px bg-white/[0.08]" />
            ) : null}
          </div>
          <div className="pb-1">
            <div className="font-semibold text-slate-100">{entry.status || "-"}</div>
            <div className="mt-1 text-xs text-slate-500">
              {formatDateTime(entry.time)}
            </div>
            {entry.note ? (
              <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-slate-400">
                {entry.note}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FranchiseOrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await franchiseApi.get(`/franchise/orders/${id}`);
      setOrder(res.data.order || null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <ConsolePage>
        <ConsoleLoading label="Loading franchise order..." />
      </ConsolePage>
    );
  }

  if (!order) {
    return (
      <ConsolePage>
        <div className="grid gap-4">
          <ConsoleNotice tone="error">{error || "Order not found"}</ConsoleNotice>
          <div>
            <ConsoleButton onClick={() => navigate("/franchise/orders")}>
              Back to orders
            </ConsoleButton>
          </div>
        </div>
      </ConsolePage>
    );
  }

  const canPrintInvoice =
    order.invoiceReady ||
    ["ACCEPTED", "PACKED", "SHIPPED", "DELIVERED"].includes(order.orderStatus);
  const address = order.address || {};

  return (
    <ConsolePage>
      <div className="grid gap-6">
        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <div>
          <ConsoleButton
            variant="ghost"
            className="px-0"
            onClick={() => navigate("/franchise/orders")}
          >
            Back to orders
          </ConsoleButton>
        </div>

        <ConsoleHeader
          title={`Order #${String(order._id).slice(-8).toUpperCase()}`}
          description={`Created ${formatDateTime(order.createdAt)} • ${
            order.items?.length || 0
          } items in this franchise-managed order.`}
          badges={
            <>
              <ConsoleBadge tone={statusTone(order.orderStatus)}>
                {order.orderStatus}
              </ConsoleBadge>
              <ConsoleBadge tone={paymentTone(order.paymentStatus)}>
                {order.paymentMode || "-"} / {order.paymentStatus || "-"}
              </ConsoleBadge>
              {order.invoiceNumber ? (
                <ConsoleBadge tone="green">{order.invoiceNumber}</ConsoleBadge>
              ) : null}
            </>
          }
          actions={
            <ConsoleButton
              onClick={() => setInvoiceOpen(true)}
              disabled={!canPrintInvoice}
            >
              Print invoice
            </ConsoleButton>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <div className="grid gap-6">
            <ConsolePanel title="Customer & delivery details">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-600">
                    Customer
                  </div>
                  <div className="mt-2 text-base font-semibold text-slate-100">
                    {order.userId?.name || address.fullName || "Customer"}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {order.userId?.email || "-"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {order.userId?.phone || address.phone || "-"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-600">
                    Delivery address
                  </div>
                  <div className="mt-2 text-base font-semibold text-slate-100">
                    {address.addressLine || "-"}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {[address.city, address.state].filter(Boolean).join(", ") || "-"}
                    {address.pincode ? ` • ${address.pincode}` : ""}
                  </div>
                </div>
              </div>
            </ConsolePanel>

            <ConsolePanel
              title="Ordered items"
              action={
                <ConsoleBadge tone="blue">{order.items?.length || 0} items</ConsoleBadge>
              }
            >
              {order.items?.length ? (
                <div className="overflow-x-auto">
                  <table className="franchise-console-table min-w-full text-sm">
                    <thead>
                      <tr>
                        {["Product", "Batch", "HSN", "Qty", "Rate", "Total"].map(
                          (header) => (
                            <th key={header} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                              {header}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items || []).map((item, idx) => {
                        const qty = Number(item.quantity || 0);
                        const price = Number(item.priceAtAdded ?? item.price ?? 0);
                        return (
                          <tr key={`${item.productId?._id || idx}`}>
                            <td className="border-t border-white/[0.05] px-4 py-3">
                              <div className="font-semibold text-slate-100">
                                {getProductName(item)}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {item.productId?.manufacturer || item.manufacturer || "-"}
                              </div>
                            </td>
                            <td className="border-t border-white/[0.05] px-4 py-3 text-slate-400">
                              {item.batchNumber || item.productId?.batchNumber || "-"}
                            </td>
                            <td className="border-t border-white/[0.05] px-4 py-3 text-slate-400">
                              {item.hsn || item.productId?.hsn || "-"}
                            </td>
                            <td className="border-t border-white/[0.05] px-4 py-3 font-semibold text-slate-200">
                              {qty}
                            </td>
                            <td className="border-t border-white/[0.05] px-4 py-3 console-mono text-slate-200">
                              {formatCurrency(price)}
                            </td>
                            <td className="border-t border-white/[0.05] px-4 py-3 console-mono font-semibold text-amber-400">
                              {formatCurrency(qty * price)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ConsoleEmptyState
                  title="No items found"
                  text="This order does not contain item-level details yet."
                />
              )}

              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <div className="text-sm text-slate-500">
                  Invoice: {order.invoiceReady ? order.invoiceNumber || "Ready" : "Pending"}
                </div>
                <div className="console-mono text-xl font-bold text-amber-400">
                  {formatCurrency(order.totalAmount)}
                </div>
              </div>
            </ConsolePanel>

            <ConsolePanel title="Tracking history">
              <Timeline history={order.trackingHistory} />
            </ConsolePanel>
          </div>

          <div className="grid gap-6">
            <ConsolePanel
              title="Fulfilment actions"
              subtitle="Move the order through the franchise delivery pipeline"
            >
              <OrderStatusActions order={order} onStatusUpdated={fetchOrder} />
            </ConsolePanel>

            <ConsolePanel title="Payment snapshot">
              <KeyValue label="Payment mode" value={order.paymentMode || "-"} />
              <KeyValue
                label="Payment status"
                value={
                  <ConsoleBadge tone={paymentTone(order.paymentStatus)}>
                    {order.paymentStatus || "-"}
                  </ConsoleBadge>
                }
              />
              <KeyValue
                label="Invoice number"
                value={
                  <span className="console-mono text-xs">
                    {order.invoiceNumber || "Pending"}
                  </span>
                }
              />
              <KeyValue label="Order total" value={formatCurrency(order.totalAmount)} />
              <KeyValue label="Delivered at" value={formatDateTime(order.deliveredAt)} />
            </ConsolePanel>

            <ConsolePanel title="Linked delivery view">
              <div className="grid gap-3 text-sm text-slate-500">
                <div>
                  Delivery phone:{" "}
                  <span className="font-semibold text-slate-100">
                    {address.phone || order.userId?.phone || "-"}
                  </span>
                </div>
                <div>
                  Pincode:{" "}
                  <span className="font-semibold text-slate-100">
                    {address.pincode || "-"}
                  </span>
                </div>
                <div>
                  Address:{" "}
                  <span className="font-semibold text-slate-100">
                    {address.addressLine || "-"}
                  </span>
                </div>
              </div>
            </ConsolePanel>
          </div>
        </div>
      </div>

      <FranchiseInvoiceDialog
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        order={order}
      />
    </ConsolePage>
  );
}
