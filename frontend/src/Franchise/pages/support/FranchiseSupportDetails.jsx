import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import franchiseApi from "../../franchiseApi";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleEmptyState,
  ConsoleHeader,
  ConsoleLoading,
  ConsoleNotice,
  ConsolePage,
  ConsolePanel,
  consoleTextareaClass,
  formatCurrency,
  formatDateTime,
} from "../../components/consoleUi";

const getStatusTone = (status) => {
  if (status === "RESOLVED") return "green";
  if (status === "IN_PROGRESS") return "blue";
  return "amber";
};

export default function FranchiseSupportDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await franchiseApi.get(`/support/${id}`);
      setTicket(response.data.ticket || null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const sendReply = async () => {
    try {
      setSending(true);
      setError("");
      await franchiseApi.post(`/support/${id}/reply`, { message: reply });
      setReply("");
      await fetchTicket();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <ConsolePage>
        <ConsoleLoading label="Loading support thread..." />
      </ConsolePage>
    );
  }

  if (!ticket) {
    return (
      <ConsolePage>
        <div className="grid gap-4">
          <ConsoleNotice tone="error">{error || "Ticket not found"}</ConsoleNotice>
          <div>
            <ConsoleButton onClick={() => navigate("/franchise/support")}>
              Back to tickets
            </ConsoleButton>
          </div>
        </div>
      </ConsolePage>
    );
  }

  return (
    <ConsolePage>
      <div className="grid gap-6">
        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <div>
          <ConsoleButton
            variant="ghost"
            className="px-0"
            onClick={() => navigate("/franchise/support")}
          >
            Back to tickets
          </ConsoleButton>
        </div>

        <ConsoleHeader
          title={ticket.subject}
          description={`Created ${formatDateTime(ticket.createdAt)}. Keep the admin thread updated with the latest context from your franchise side.`}
          badges={
            <>
              <ConsoleBadge tone="blue">{ticket.category}</ConsoleBadge>
              <ConsoleBadge tone={getStatusTone(ticket.status)}>
                {ticket.status}
              </ConsoleBadge>
            </>
          }
          actions={
            ticket.orderId?._id ? (
              <ConsoleButton
                variant="secondary"
                onClick={() => navigate(`/franchise/orders/${ticket.orderId._id}`)}
              >
                Open linked order
              </ConsoleButton>
            ) : null
          }
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="grid gap-6">
            <ConsolePanel title="Ticket summary">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-7 text-slate-300">
                {ticket.message}
              </div>

              {ticket.orderId?._id ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                      Order
                    </div>
                    <div className="console-mono mt-2 text-sm font-bold text-slate-100">
                      #{String(ticket.orderId._id).slice(-8).toUpperCase()}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                      Status
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-100">
                      {ticket.orderId.orderStatus || "-"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                      Payment
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-100">
                      {ticket.orderId.paymentMode || "-"} /{" "}
                      {ticket.orderId.paymentStatus || "-"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-600">
                      Amount
                    </div>
                    <div className="console-mono mt-2 text-sm font-bold text-amber-400">
                      {formatCurrency(ticket.orderId.totalAmount)}
                    </div>
                  </div>
                </div>
              ) : null}
            </ConsolePanel>

            <ConsolePanel title="Conversation timeline">
              <div className="grid gap-4">
                <div className="max-w-[85%] rounded-2xl border border-amber-500/12 bg-amber-500/[0.08] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                    Franchise • {formatDateTime(ticket.createdAt)}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-200">{ticket.message}</div>
                </div>

                {(ticket.replies || []).length ? (
                  (ticket.replies || []).map((entry, index) => (
                    <div
                      key={`${entry.sender || "reply"}-${index}`}
                      className={`max-w-[85%] rounded-2xl border p-4 ${
                        entry.sender === "ADMIN"
                          ? "border-sky-500/12 bg-sky-500/[0.07]"
                          : "ml-auto border-emerald-500/12 bg-emerald-500/[0.07]"
                      }`}
                    >
                      <div
                        className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
                          entry.sender === "ADMIN" ? "text-sky-300" : "text-emerald-300"
                        }`}
                      >
                        {entry.sender} • {formatDateTime(entry.time)}
                      </div>
                      <div className="mt-2 text-sm leading-7 text-slate-200">
                        {entry.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <ConsoleEmptyState
                    title="No replies yet"
                    text="Admin replies and your follow-up messages will appear here."
                  />
                )}
              </div>
            </ConsolePanel>
          </div>

          <div className="grid gap-6">
            <ConsolePanel title="Reply console" subtitle="Share the latest update with admin">
              <div className="grid gap-4">
                <textarea
                  className={consoleTextareaClass}
                  rows={7}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Share the latest update, customer note, or what you need from admin next."
                />
                <div className="flex flex-wrap gap-2">
                  <ConsoleButton
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                  >
                    {sending ? "Sending..." : "Send reply"}
                  </ConsoleButton>
                  <ConsoleButton variant="secondary" onClick={fetchTicket}>
                    Refresh thread
                  </ConsoleButton>
                </div>
              </div>
            </ConsolePanel>

            <ConsolePanel title="Thread metadata">
              <div className="grid gap-3 text-sm text-slate-500">
                <div>
                  Ticket ID:{" "}
                  <span className="console-mono font-semibold text-slate-100">
                    {ticket._id}
                  </span>
                </div>
                <div>
                  Category: <span className="font-semibold text-slate-100">{ticket.category}</span>
                </div>
                <div>
                  Replies:{" "}
                  <span className="font-semibold text-slate-100">
                    {ticket.replies?.length || 0}
                  </span>
                </div>
                <div>
                  Last updated:{" "}
                  <span className="font-semibold text-slate-100">
                    {formatDateTime(ticket.updatedAt || ticket.createdAt)}
                  </span>
                </div>
              </div>
            </ConsolePanel>
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}
