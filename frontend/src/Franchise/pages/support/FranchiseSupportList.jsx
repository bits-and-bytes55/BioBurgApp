import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import franchiseApi from "../../franchiseApi";
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
  formatDate,
  formatNumber,
} from "../../components/consoleUi";

const statuses = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"];
const categories = ["ALL", "ORDER", "PAYMENT", "INVENTORY", "TECHNICAL", "OTHER"];

const getStatusTone = (status) => {
  if (status === "RESOLVED") return "green";
  if (status === "IN_PROGRESS") return "blue";
  return "amber";
};

const exportTicketsCsv = (tickets) => {
  if (!tickets.length) return;

  const rows = tickets.map((ticket) => ({
    subject: ticket.subject || "",
    category: ticket.category || "",
    status: ticket.status || "",
    order_id: ticket.orderId?._id
      ? String(ticket.orderId._id).slice(-8).toUpperCase()
      : "",
    order_status: ticket.orderId?.orderStatus || "",
    replies: ticket.replies?.length || 0,
    created_at: ticket.createdAt
      ? new Date(ticket.createdAt).toLocaleDateString("en-IN")
      : "",
    updated_at: ticket.updatedAt
      ? new Date(ticket.updatedAt).toLocaleDateString("en-IN")
      : "",
  }));

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `franchise-support-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const defaultFilters = {
  search: "",
  status: "ALL",
  category: "ALL",
  from: "",
  to: "",
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

export default function FranchiseSupportList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTickets = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const response = await franchiseApi.get("/support/my", {
        params: nextFilters,
      });
      setTickets(response.data.tickets || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(defaultFilters);
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    fetchTickets(filters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    fetchTickets(defaultFilters);
  };

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          title="Support Tickets"
          description="Track franchise issues, admin replies, linked orders, and resolution progress from one workspace."
          badges={
            <>
              <ConsoleBadge tone="blue">{formatNumber(summary.total || 0)} total tickets</ConsoleBadge>
              <ConsoleBadge tone="amber">{formatNumber(summary.OPEN || 0)} open</ConsoleBadge>
              <ConsoleBadge tone="green">{formatNumber(summary.RESOLVED || 0)} resolved</ConsoleBadge>
            </>
          }
          actions={
            <>
              <ConsoleButton onClick={() => navigate("/franchise/support/create")}>
                New Ticket
              </ConsoleButton>
              <ConsoleButton
                variant="secondary"
                onClick={() => exportTicketsCsv(tickets)}
                disabled={!tickets.length}
              >
                Export CSV
              </ConsoleButton>
            </>
          }
        />

        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ConsoleMetricCard
            label="Total Tickets"
            primary={formatNumber(summary.total || 0)}
            secondary="Current result set"
          />
          <ConsoleMetricCard
            label="Open"
            primary={formatNumber(summary.OPEN || 0)}
            secondary="Needs fresh response"
          />
          <ConsoleMetricCard
            label="In Progress"
            primary={formatNumber(summary.IN_PROGRESS || 0)}
            secondary="Already under review"
            accent
          />
          <ConsoleMetricCard
            label="Resolved"
            primary={formatNumber(summary.RESOLVED || 0)}
            secondary="Closed after handling"
          />
        </div>

        <ConsolePanel title="Filter console" subtitle="Search subject, category, message, or linked order">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[2fr_repeat(4,minmax(0,1fr))]">
            <Field label="Search">
              <input
                className={consoleInputClass}
                value={filters.search}
                onChange={(event) => handleFilterChange("search", event.target.value)}
                placeholder="Subject, category, message, order..."
              />
            </Field>
            <Field label="Status">
              <select
                className={consoleInputClass}
                value={filters.status}
                onChange={(event) => handleFilterChange("status", event.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                className={consoleInputClass}
                value={filters.category}
                onChange={(event) => handleFilterChange("category", event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="From">
              <input
                className={consoleInputClass}
                type="date"
                value={filters.from}
                onChange={(event) => handleFilterChange("from", event.target.value)}
              />
            </Field>
            <Field label="To">
              <input
                className={consoleInputClass}
                type="date"
                value={filters.to}
                onChange={(event) => handleFilterChange("to", event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ConsoleButton onClick={applyFilters}>Apply Filters</ConsoleButton>
            <ConsoleButton variant="secondary" onClick={resetFilters}>
              Reset
            </ConsoleButton>
          </div>
        </ConsolePanel>

        <ConsolePanel
          title="Ticket workspace"
          subtitle={`${tickets.length} tickets in the current filtered view`}
        >
          {loading ? (
            <ConsoleLoading label="Loading support workspace..." />
          ) : tickets.length === 0 ? (
            <ConsoleEmptyState
              title="No support tickets found"
              text="Try a broader filter range or create the first ticket for this franchise."
            />
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-100">{ticket.subject}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {ticket.message?.slice(0, 90) || ""}
                          {ticket.message?.length > 90 ? "..." : ""}
                        </div>
                      </div>
                      <ConsoleBadge tone={getStatusTone(ticket.status)}>
                        {ticket.status}
                      </ConsoleBadge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ConsoleBadge tone="blue">{ticket.category}</ConsoleBadge>
                      {ticket.orderId?._id ? (
                        <ConsoleBadge tone="neutral">
                          #{String(ticket.orderId._id).slice(-8).toUpperCase()}
                        </ConsoleBadge>
                      ) : null}
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      Replies {ticket.replies?.length || 0} • Updated{" "}
                      {formatDate(ticket.updatedAt || ticket.createdAt)}
                    </div>
                    <div className="mt-4">
                      <ConsoleButton
                        variant="secondary"
                        onClick={() => navigate(`/franchise/support/${ticket._id}`)}
                      >
                        Open
                      </ConsoleButton>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="franchise-console-table min-w-full text-sm">
                  <thead>
                    <tr>
                      {["Subject", "Category", "Status", "Order", "Replies", "Updated", "Action"].map(
                        (header) => (
                          <th key={header} className={consoleTableHeadClass}>
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket._id}>
                        <td className={`${consoleTableCellClass} min-w-[260px]`}>
                          <div className="font-semibold text-slate-100">{ticket.subject}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {ticket.message?.slice(0, 80) || ""}
                            {ticket.message?.length > 80 ? "..." : ""}
                          </div>
                        </td>
                        <td className={consoleTableCellClass}>{ticket.category}</td>
                        <td className={consoleTableCellClass}>
                          <ConsoleBadge tone={getStatusTone(ticket.status)}>
                            {ticket.status}
                          </ConsoleBadge>
                        </td>
                        <td className={consoleTableCellClass}>
                          {ticket.orderId?._id ? (
                            <div>
                              <div className="console-mono text-xs font-bold tracking-[0.16em] text-slate-200">
                                #{String(ticket.orderId._id).slice(-8).toUpperCase()}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {ticket.orderId.orderStatus || "-"}
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className={consoleTableCellClass}>
                          {ticket.replies?.length || 0}
                        </td>
                        <td className={consoleTableCellClass}>
                          {formatDate(ticket.updatedAt || ticket.createdAt)}
                        </td>
                        <td className={consoleTableCellClass}>
                          <ConsoleButton
                            variant="secondary"
                            onClick={() => navigate(`/franchise/support/${ticket._id}`)}
                          >
                            Open
                          </ConsoleButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </ConsolePanel>
      </div>
    </ConsolePage>
  );
}
