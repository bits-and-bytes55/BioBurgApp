import React, { useEffect, useMemo, useState } from "react";
import { Box, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
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
  adminFieldSx,
  adminTableSx,
  formatDateTime,
} from "./adminFranchiseUi";

const statusTone = (status) => {
  if (status === "RESOLVED") return "green";
  if (status === "IN_PROGRESS") return "blue";
  return "amber";
};

export default function AdminSupportTickets({ onOpenTicket }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await adminFranchiseApi.get("/support");
      setTickets(res.data.tickets || []);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    await adminFranchiseApi.put(`/support/${id}/status`, { status });
    fetchTickets();
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : ticket.status === statusFilter;
      const haystack = [
        ticket.franchiseId?.email,
        ticket.subject,
        ticket.category,
        ticket.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = search
        ? haystack.includes(search.trim().toLowerCase())
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, tickets]);

  const summary = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      progress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS")
        .length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
    }),
    [tickets],
  );

  if (loading) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading support escalation desk..." />
      </AdminFranchisePage>
    );
  }

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title="Franchise Support Desk"
          description="Monitor support pressure across franchise accounts, update ticket states, and open the full conversation thread when escalation needs detail."
          badges={
            <>
              <AdminFranchiseBadge tone="blue">{summary.total} tickets</AdminFranchiseBadge>
              <AdminFranchiseBadge tone="amber">{summary.open} open</AdminFranchiseBadge>
              <AdminFranchiseBadge tone="green">{summary.resolved} resolved</AdminFranchiseBadge>
            </>
          }
          actions={
            <>
              <AdminFranchiseButton variant="secondary" onClick={fetchTickets}>
                Refresh
              </AdminFranchiseButton>
            </>
          }
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          <AdminFranchiseMetric label="All Tickets" value={summary.total} helper="Franchise-raised support volume" />
          <AdminFranchiseMetric label="Open" value={summary.open} helper="Waiting for admin action" />
          <AdminFranchiseMetric label="In Progress" value={summary.progress} helper="Actively being handled" />
          <AdminFranchiseMetric label="Resolved" value={summary.resolved} helper="Closed successfully" accent />
        </Box>

        <AdminFranchisePanel
          title="Ticket Operations"
          subtitle="Filter by status, search the queue, and jump into any thread."
          action={
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2 }}>
              <TextField
                size="small"
                placeholder="Search subject, message, email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={adminFieldSx}
              />
              <Select
                size="small"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={adminFieldSx}
              >
                <MenuItem value="ALL">All statuses</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN_PROGRESS">In progress</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
              </Select>
            </Box>
          }
        >
          <AdminFranchiseNotice tone="info">
            Status changes here update the franchise-facing workspace immediately.
          </AdminFranchiseNotice>

          <Box sx={{ mt: 3, overflowX: "auto" }}>
            {!filteredTickets.length ? (
              <AdminFranchiseEmpty
                title="No tickets found"
                text="Try a different status filter or search term. The queue is currently clear for this view."
              />
            ) : (
              <Table sx={adminTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Franchise</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell>Change</TableCell>
                    <TableCell>Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell>
                        <Box sx={{ fontWeight: 700 }}>{ticket.franchiseId?.email || "-"}</Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ fontWeight: 700 }}>{ticket.subject}</Box>
                        <Box sx={{ color: "#8da0ad", fontSize: 13, mt: 0.6 }}>
                          {(ticket.message || "").slice(0, 90) || "No message preview"}
                        </Box>
                      </TableCell>
                      <TableCell>{ticket.category || "-"}</TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={statusTone(ticket.status)}>
                          {ticket.status}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>{formatDateTime(ticket.updatedAt || ticket.createdAt)}</TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={ticket.status}
                          onChange={(event) => changeStatus(ticket._id, event.target.value)}
                          sx={adminFieldSx}
                        >
                          <MenuItem value="OPEN">OPEN</MenuItem>
                          <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                          <MenuItem value="RESOLVED">RESOLVED</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <AdminFranchiseButton
                          variant="secondary"
                          onClick={() => onOpenTicket && onOpenTicket(ticket._id)}
                        >
                          View thread
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
    </AdminFranchisePage>
  );
}
