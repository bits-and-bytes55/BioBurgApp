import React, { useEffect, useMemo, useState } from "react";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import franchiseApi from "../../Franchise/franchiseApi";
import {
  AdminFranchiseBadge,
  AdminFranchiseButton,
  AdminFranchiseEmpty,
  AdminFranchiseHero,
  AdminFranchiseLoading,
  AdminFranchiseMetric,
  AdminFranchisePage,
  AdminFranchisePanel,
  adminFieldSx,
  adminTableSx,
  formatDateTime,
} from "./adminFranchiseUi";

const toneFromStatus = (status) => {
  if (status === "RESOLVED") return "green";
  if (status === "IN_PROGRESS") return "blue";
  return "amber";
};

export default function FranchiseSupportList({ onOpen }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await franchiseApi.get("/support/my");
      setTickets(res.data.tickets || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const haystack = [ticket.subject, ticket.category, ticket.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return search ? haystack.includes(search.trim().toLowerCase()) : true;
    });
  }, [search, tickets]);

  if (loading) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading support tickets..." />
      </AdminFranchisePage>
    );
  }

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title="My Support Tickets"
          description="Review every ticket raised from the franchise side and open any thread that needs follow-up."
          actions={
            <AdminFranchiseButton variant="secondary" onClick={fetchTickets}>
              Refresh
            </AdminFranchiseButton>
          }
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          <AdminFranchiseMetric label="Total Tickets" value={tickets.length} helper="All support threads" />
          <AdminFranchiseMetric label="Open" value={tickets.filter((ticket) => ticket.status === "OPEN").length} helper="Waiting for action" />
          <AdminFranchiseMetric label="Resolved" value={tickets.filter((ticket) => ticket.status === "RESOLVED").length} helper="Completed threads" accent />
        </Box>

        <AdminFranchisePanel
          title="Ticket List"
          action={
            <TextField
              size="small"
              placeholder="Search subject or category"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={adminFieldSx}
            />
          }
        >
          <Box sx={{ overflowX: "auto" }}>
            {!filteredTickets.length ? (
              <AdminFranchiseEmpty
                title="No tickets found"
                text="The current search term returned no support tickets."
              />
            ) : (
              <Table sx={adminTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell>Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>{ticket.category}</TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={toneFromStatus(ticket.status)}>
                          {ticket.status}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>{formatDateTime(ticket.updatedAt || ticket.createdAt)}</TableCell>
                      <TableCell>
                        <AdminFranchiseButton variant="secondary" onClick={() => onOpen(ticket._id)}>
                          Open
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
