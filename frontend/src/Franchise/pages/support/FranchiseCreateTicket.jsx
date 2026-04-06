import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import franchiseApi from "../../franchiseApi";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleHeader,
  ConsoleNotice,
  ConsolePage,
  ConsolePanel,
  consoleInputClass,
  consoleTextareaClass,
} from "../../components/consoleUi";

const categories = ["ORDER", "PAYMENT", "INVENTORY", "TECHNICAL", "OTHER"];

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

export default function FranchiseCreateTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: "",
    category: "OTHER",
    message: "",
    orderId: "",
  });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const response = await franchiseApi.get("/franchise/orders", {
          params: { sortBy: "newest" },
        });
        setOrders((response.data.orders || []).slice(0, 50));
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submitTicket = async () => {
    try {
      setSubmitting(true);
      setError("");
      await franchiseApi.post("/support", form);
      navigate("/franchise/support");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create support ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOrder = orders.find((order) => order._id === form.orderId);

  return (
    <ConsolePage>
      <div className="grid gap-6">
        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <ConsoleHeader
          title="Create Support Ticket"
          description="Link an order when the issue is fulfilment, payment, or delivery specific. That gives admin the exact order context and speeds up resolution."
          actions={
            <ConsoleButton variant="secondary" onClick={() => navigate("/franchise/support")}>
              Back to tickets
            </ConsoleButton>
          }
        />

        <ConsolePanel title="Ticket composer" subtitle="Describe the issue clearly and add an order when needed">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Subject">
              <input
                className={consoleInputClass}
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Customer says item was missing"
              />
            </Field>

            <Field label="Category">
              <select
                className={consoleInputClass}
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Link order (optional)">
                <select
                  className={consoleInputClass}
                  name="orderId"
                  value={form.orderId}
                  onChange={handleChange}
                  disabled={loadingOrders}
                >
                  <option value="">
                    {loadingOrders
                      ? "Loading recent franchise orders..."
                      : "No linked order"}
                  </option>
                  {orders.map((order) => (
                    <option key={order._id} value={order._id}>
                      #{String(order._id).slice(-8).toUpperCase()} |{" "}
                      {order.userId?.name || order.address?.fullName || "Customer"} |{" "}
                      {order.orderStatus} | ₹
                      {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {selectedOrder ? (
              <div className="md:col-span-2">
                <ConsoleNotice tone="info">
                  Linked order #{String(selectedOrder._id).slice(-8).toUpperCase()} is
                  currently {selectedOrder.orderStatus} with payment{" "}
                  {selectedOrder.paymentMode || "-"} /{" "}
                  {selectedOrder.paymentStatus || "-"}.
                </ConsoleNotice>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <Field label="Describe the issue">
                <textarea
                  className={consoleTextareaClass}
                  rows={7}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Add the customer issue, current situation, and what help you need from admin."
                />
              </Field>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ConsoleButton onClick={submitTicket} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit ticket"}
            </ConsoleButton>
            <ConsoleButton variant="secondary" onClick={() => navigate("/franchise/support")}>
              Cancel
            </ConsoleButton>
          </div>
        </ConsolePanel>

        <ConsolePanel title="Ticket guidance">
          <div className="flex flex-wrap gap-2">
            <ConsoleBadge tone="amber">Attach order context when possible</ConsoleBadge>
            <ConsoleBadge tone="blue">Share current status and blocker</ConsoleBadge>
            <ConsoleBadge tone="green">Mention what resolution you need</ConsoleBadge>
          </div>
        </ConsolePanel>
      </div>
    </ConsolePage>
  );
}
